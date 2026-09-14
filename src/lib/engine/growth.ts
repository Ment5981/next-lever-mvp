import { fetchZhihuResources } from "@/lib/providers/zhihu";
import { analyzeGrowthFeedback } from "@/lib/providers/llm";
import type {
  Application,
  CriterionAssessment,
  EmployerDecision,
  FeedbackSignal,
  GrowthReport,
  GrowthTask,
  JobAssessment,
  JobVersion,
} from "@/lib/schema/domain";
import { GrowthReport as GrowthReportSchema } from "@/lib/schema/domain";
import type { FeedbackCategory, SourceLabel } from "@/lib/schema/enums";
import { makeId, nowIso, round } from "./util";

/**
 * 成长 Agent。
 *
 * 口径约束（PRD 硬要求）：
 * - 不对多个岗位的分数做简单平均，也不从少量样本推断整个就业市场。
 * - 「材料证据问题」与「能力差距」必须分开：拿不到证据只说明无法判断。
 * - 每条信号都要能引到具体岗位的原始反馈，并标注来源是真人确认还是 Agent 推断。
 * - 只在生成报告或用户主动刷新时调用知乎能力。
 */

/** 同一能力主题在几个岗位上被提到才算「跨岗位重复信号」。 */
const REPEATED_MIN_JOBS = 2;

/** 引用原文的截断长度，避免超出 schema 对 quote 的长度限制。 */
const QUOTE_FINDING_MAX = 360;

/**
 * 能力主题归并表。
 *
 * 各岗位会用不同措辞描述同一件事（「书面表达与文档」/「客户沟通表达」/「技术沟通能力」），
 * 若按能力名称精确比较，跨岗位重复信号与冲突反馈将永远无法被识别。
 * 这里用关键词把岗位措辞收敛到统一主题，命中顺序即优先级。
 */
const CAPABILITY_THEMES: { theme: string; keywords: string[] }[] = [
  { theme: "可运行作品与产出证据", keywords: ["可运行作品", "作品产出"] },
  { theme: "开源与社区参与", keywords: ["开源", "社区"] },
  {
    theme: "企业客户场景与业务结果量化",
    keywords: ["企业客户", "业务结果", "量化"],
  },
  {
    theme: "AI 能力理解与效果评测",
    keywords: ["AI 能力", "AI 方案", "Prompt", "评测"],
  },
  { theme: "沟通与表达", keywords: ["沟通", "表达", "文档"] },
  {
    theme: "用户研究与产品闭环",
    keywords: ["用户研究", "产品闭环", "产品判断"],
  },
  { theme: "跨角色协作与交付推进", keywords: ["协作", "交付"] },
  { theme: "自驱与学习速度", keywords: ["自驱", "学习速度"] },
];

function themeOf(criterionName: string): string {
  for (const entry of CAPABILITY_THEMES) {
    if (entry.keywords.some((kw) => criterionName.includes(kw))) {
      return entry.theme;
    }
  }
  // 未收录的能力自成一个主题，不会被错误归并到别人身上。
  return criterionName;
}

export type JobContext = {
  job: JobVersion;
  assessment: JobAssessment;
  decision: EmployerDecision | null;
};

function jobLabel(job: JobVersion): string {
  return `${job.company_name} · ${job.title}`;
}

/**
 * 反馈来源标签。真人确认过的岗位才允许出现「招聘方反馈」，
 * 其余一律标为「招聘方 Agent 推断」。
 */
function sourceOf(ctx: JobContext): SourceLabel {
  return ctx.decision ? "EmployerConfirmedFeedback" : "JobAgentInference";
}

type Mention = {
  ctx: JobContext;
  criterion: CriterionAssessment;
};

type ThemeGroup = {
  theme: string;
  /** gap_type 不为 none 的能力项，即需要进入成长信号的部分。 */
  gaps: Mention[];
  /** 已被证据支撑的能力项，用于识别方向相反的冲突反馈。 */
  supported: Mention[];
};

function groupByTheme(contexts: JobContext[]): ThemeGroup[] {
  const groups = new Map<string, ThemeGroup>();
  for (const ctx of contexts) {
    for (const criterion of ctx.assessment.criterion_assessments) {
      const theme = themeOf(criterion.criterion_name);
      const group = groups.get(theme) ?? { theme, gaps: [], supported: [] };
      if (criterion.gap_type === "none") {
        group.supported.push({ ctx, criterion });
      } else {
        group.gaps.push({ ctx, criterion });
      }
      groups.set(theme, group);
    }
  }
  // 只有存在缺口的主题才需要成长信号。
  return [...groups.values()].filter((g) => g.gaps.length > 0);
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function citationOf(mention: Mention) {
  const { criterion } = mention;
  return {
    job_version_id: mention.ctx.job.job_version_id,
    quote: truncate(
      `${jobLabel(mention.ctx.job)}｜${criterion.criterion_name}（权重 ${criterion.weight}%，证据等级 ${criterion.evidence_level}）：${criterion.finding}`,
      QUOTE_FINDING_MAX + 120,
    ),
    source: sourceOf(mention.ctx),
  };
}

function jobIdsOf(mentions: Mention[]): string[] {
  return [...new Set(mentions.map((m) => m.ctx.job.job_version_id))];
}

/** 同一岗位可能有多条同主题能力项，展示时按岗位去重。 */
function jobLabelsOf(mentions: Mention[]): string {
  return [...new Set(mentions.map((m) => jobLabel(m.ctx.job)))].join("、");
}

/**
 * 判定一个主题属于哪一类反馈。判定顺序本身就是口径：
 * 1. evidence_problem：全部缺口都来自拿不到证据，属于材料问题而非能力问题，
 *    这一条优先，避免把「没看到」写成「不具备」。
 * 2. repeated_signal：≥2 个岗位都指出同一主题，是本批次重复出现的信号。
 * 3. conflicting：只有一个岗位指出，但另有岗位认为同主题证据已足够，
 *    两边结论方向相反，差异来自岗位证据标准不同。
 * 4. job_specific：只有单个岗位提出，其他岗位没有就该主题表态。
 */
function categorize(group: ThemeGroup): FeedbackCategory {
  const evidenceOnly = group.gaps.every(
    (m) =>
      m.criterion.gap_type === "evidence_missing" ||
      m.criterion.evidence_level === "L0",
  );
  if (evidenceOnly) return "evidence_problem";

  if (jobIdsOf(group.gaps).length >= REPEATED_MIN_JOBS) return "repeated_signal";

  // 「判断类缺口」指评估给出了结论上的不足（能力差距或尚不能确认），
  // 而不是单纯拿不到材料。只有这种缺口与「已被证据支撑」并存才算方向冲突。
  const hasJudgmentGap = group.gaps.some(
    (m) =>
      m.criterion.gap_type === "capability_gap" ||
      m.criterion.gap_type === "unknown",
  );
  if (group.supported.length > 0 && hasJudgmentGap) return "conflicting";

  return "job_specific";
}

function statementFor(
  group: ThemeGroup,
  category: FeedbackCategory,
  totalJobs: number,
): string {
  const gapJobs = jobIdsOf(group.gaps).length;
  switch (category) {
    case "conflicting":
      return `「${group.theme}」在不同岗位得到方向相反的结论：${jobLabelsOf(
        group.supported,
      )}认为现有证据可以支撑，而${jobLabelsOf(
        group.gaps,
      )}按自身证据标准判为不足。差异来自岗位标准不同，不能合并成一个结论。`;
    case "evidence_problem":
      return `「${group.theme}」的判断受材料限制：授权范围内没有可核验证据，${gapJobs} 个岗位只能按信息不足处理。这属于材料证据问题，不代表不具备该能力。`;
    case "repeated_signal": {
      const overlap =
        group.supported.length > 0
          ? `另有 ${jobIdsOf(group.supported).length} 个岗位认为同主题证据已足够，说明各岗位标准不同，不能合并成一个结论。`
          : "";
      return `「${group.theme}」在 ${gapJobs} 个岗位被同时指出，是本批次重复出现的信号。${overlap}样本仅限这 ${totalJobs} 个岗位，不代表整体市场判断。`;
    }
    default:
      return `「${group.theme}」只有 ${jobLabel(group.gaps[0].ctx.job)} 提出，属于该岗位特有要求，优先级应低于跨岗位重复信号。`;
  }
}

export function buildSignals(contexts: JobContext[]): FeedbackSignal[] {
  const signals = groupByTheme(contexts).map((group) => {
    const category = categorize(group);
    // 只要结论里提到了「另有岗位认为证据已足够」，就必须把这一侧也引出来，
    // 用户才能看到差异到底来自哪个岗位的哪条标准。
    const citeSupported =
      category === "conflicting" ||
      (category === "repeated_signal" && group.supported.length > 0);
    const cited = citeSupported ? [...group.gaps, ...group.supported] : group.gaps;
    return {
      signal_id: makeId("sig"),
      category,
      statement: truncate(statementFor(group, category, contexts.length), 560),
      job_version_ids: jobIdsOf(cited),
      citations: cited.map(citationOf),
    } satisfies FeedbackSignal;
  });

  // 展示顺序按对求职者的行动价值排序。
  const order: Record<FeedbackCategory, number> = {
    repeated_signal: 0,
    evidence_problem: 1,
    job_specific: 2,
    conflicting: 3,
  };
  return signals.sort((a, b) => order[a.category] - order[b.category]);
}

type TaskPlan = {
  theme: string;
  category: FeedbackCategory;
  mentions: Mention[];
};

/**
 * 加权重要度：权重越高、涉及岗位越多、越是硬性条件，越值得优先补。
 * 证据问题额外加权，因为补一份可核验产出往往能同时解锁多个岗位的判断。
 */
function priorityOf(plan: TaskPlan): number {
  const weight = Math.max(...plan.mentions.map((m) => m.criterion.weight));
  const jobs = jobIdsOf(plan.mentions).length;
  const mustHave = plan.mentions.some((m) => m.criterion.must_have) ? 12 : 0;
  const evidenceBonus = plan.category === "evidence_problem" ? 10 : 0;
  return weight + jobs * 8 + mustHave + evidenceBonus;
}

/** 选出 1-3 项最值得投入的能力，优先能产生新证据的方向。 */
export function planTasks(contexts: JobContext[]): TaskPlan[] {
  const plans = groupByTheme(contexts).map((group) => ({
    theme: group.theme,
    category: categorize(group),
    mentions: group.gaps,
  }));
  return plans.sort((a, b) => priorityOf(b) - priorityOf(a)).slice(0, 3);
}

type PracticeDetail = {
  practice: string;
  deliverable: string;
  recommendCompetition: boolean;
  note: string;
  effort: string;
  learning: string[];
  acceptance: string[];
};

/**
 * 实践任务优先指向能产生新证据的产出：可运行作品、开源贡献、真实场景实践，
 * 而不是只推荐课程。
 */
function practiceFor(plan: TaskPlan): PracticeDetail {
  const mustHave = plan.mentions.some((m) => m.criterion.must_have);

  if (plan.category === "evidence_problem") {
    return {
      practice: `重建一个可访问、可运行的小型作品来覆盖「${plan.theme}」：范围压到一个真实可用的功能即可，部署到任意公开可访问环境，并在说明里逐条标注本人实现的部分与借助工具完成的部分。`,
      deliverable:
        "一个公开可访问的作品链接，附一页实现说明（含本人负责范围、已知限制）",
      recommendCompetition: true,
      note: "建议直接投一次黑客松，或把作品提交为开源仓库：外部评审记录和提交历史本身就是第三方可核验证据，比自述更能解决当前的证据缺口。",
      effort: "2 到 3 周，每周 8 到 10 小时",
      learning: [
        "最小可用产品的范围裁剪：如何把一个想法压缩到两周内能跑起来",
        "作品说明的写法：区分本人实现、工具生成与他人协作的部分",
        "公开部署与访问稳定性的基本要求",
      ],
      acceptance: [
        "链接可在无需登录的情况下打开并完成一次核心流程",
        "说明中每个功能点都能对应到具体实现描述，本人负责范围明确",
        "已知限制被主动列出，而不是等提问才补充",
      ],
    };
  }

  if (mustHave) {
    return {
      practice: `围绕「${plan.theme}」找一个真实场景做一轮完整实践：明确目标、定义衡量口径、执行、记录结果与偏差，并输出一份可给第三方看的复盘。`,
      deliverable: "一份含目标、口径定义、过程记录、结果与偏差分析的实践复盘文档",
      recommendCompetition: true,
      note: "优先选真实场景（社团、开源项目、小型合作方）而不是模拟练习，真实场景才会产生可被追问的细节。",
      effort: "3 到 4 周，每周 6 到 8 小时",
      learning: [
        "指标口径定义：基线、对照与统计范围怎么说清楚",
        "结果归因：区分自己的动作带来的变化与外部因素",
        `${plan.theme}在实际岗位里的判断标准与常见误区`,
      ],
      acceptance: [
        "复盘中的每个结论都能指向具体过程记录",
        "指标有明确的口径与对照方式，不使用无法核验的绝对数字",
        "能说明这次实践没有解决的问题",
      ],
    };
  }

  return {
    practice: `针对「${plan.theme}」做一次小范围公开输出：把已有经历整理成可被检验的记录（技术写作、开源文档贡献或公开分享），补上目前缺少的第三方可见证据。`,
    deliverable: "一篇公开发布的内容，或一次已合入的开源贡献记录",
    recommendCompetition: true,
    note: "开源文档与 issue 讨论门槛低但留痕清晰，适合作为这项能力的第一份外部证据。",
    effort: "1 到 2 周，每周 4 到 6 小时",
    learning: [
      `${plan.theme}的常见评价标准`,
      "把个人经历写成他人可复用内容的结构方法",
    ],
    acceptance: [
      "内容或贡献有公开可访问的地址",
      "包含具体过程与判断依据，不是结论堆叠",
      "至少收到一次外部反馈（评论、review 或合入记录）",
    ],
  };
}

function reasonFor(plan: TaskPlan, contexts: JobContext[]): string {
  const jobs = [...new Set(plan.mentions.map((m) => jobLabel(m.ctx.job)))];
  switch (plan.category) {
    case "evidence_problem":
      return `${jobs.join("、")}都无法核验「${plan.theme}」，原因是授权材料里没有可访问的产出，而不是评估认为你不具备该能力。补上可核验产出后，这一项可以重新评估。`;
    case "repeated_signal":
      return `「${plan.theme}」在 ${jobs.length} 个岗位被同时指出（本批次共 ${contexts.length} 个岗位），是当前投递方向上重复出现的短板，优先补收益最高。`;
    case "conflicting":
      return `不同岗位对「${plan.theme}」的结论不一致，说明各岗位证据标准不同。补一份更高等级的证据可以同时满足两种标准。`;
    default:
      return `「${plan.theme}」目前只被${jobs.join(
        "、",
      )}提出，属于该岗位特有要求。如果继续投递同类岗位，值得补齐。`;
  }
}

/** 用目标能力主题 + 涉及岗位标题构造知乎检索词。 */
function queryFor(plan: TaskPlan): string {
  const titles = [...new Set(plan.mentions.map((m) => m.ctx.job.title))];
  return `${plan.theme} ${titles.join(" ")}`.trim();
}

export type BuildReportInput = {
  candidateAgentId: string;
  jobs: JobVersion[];
  assessments: JobAssessment[];
  decisions: EmployerDecision[];
  applications: Application[];
  authorizedCount: number;
  userId: string;
  /** true 表示用户主动刷新，允许绕过服务端缓存。 */
  forceRefresh?: boolean;
  /** 关闭知乎调用，仅用于单元测试。 */
  skipZhihu?: boolean;
};

export type BuildReportOutcome = {
  ok: boolean;
  blockers: string[];
  report: GrowthReport | null;
};

/**
 * 生成成长报告。已授权的岗位全部产出结果后才允许生成，
 * 避免用不完整样本得出结论。
 */
export async function buildGrowthReport(
  input: BuildReportInput,
): Promise<BuildReportOutcome> {
  const contexts: JobContext[] = [];
  for (const assessment of input.assessments) {
    const job = input.jobs.find(
      (j) => j.job_version_id === assessment.job_version_id,
    );
    if (!job) continue;
    contexts.push({
      job,
      assessment,
      decision:
        input.decisions.find((d) => d.task_id === assessment.task_id) ?? null,
    });
  }

  if (contexts.length < input.authorizedCount || contexts.length === 0) {
    return {
      ok: false,
      blockers: [
        `已授权 ${input.authorizedCount} 个岗位，目前只有 ${contexts.length} 个产出结果，等全部岗位返回后再生成报告`,
      ],
      report: null,
    };
  }

  const signals = buildSignals(contexts);
  const analysis = await analyzeGrowthFeedback({
    feedbackText: contexts
      .map((context) => [
        `岗位：${context.job.company_name} · ${context.job.title}`,
        `Agent 建议：${context.assessment.suggestion_reason}`,
        `优势：${context.assessment.strengths.join("；")}`,
        `证据缺口：${context.assessment.evidence_gaps.join("；")}`,
      ].join("\n"))
      .join("\n\n")
      .slice(0, 12000),
  });
  const plans = planTasks(contexts);

  const growthTasks: GrowthTask[] = [];
  for (const plan of plans) {
    const taskId = makeId("gtask");
    const detail = practiceFor(plan);

    let zhihu: Awaited<ReturnType<typeof fetchZhihuResources>> | null = null;
    if (!input.skipZhihu) {
      // 只在生成报告（或用户主动刷新）这一刻调用，不轮询。
      zhihu = await fetchZhihuResources({
        taskId,
        query: queryFor(plan),
        whyForTask: `围绕「${plan.theme}」的学习内容，用于支撑本任务的产出：${detail.deliverable}`,
        userId: input.userId,
        limit: 3,
        forceRefresh: input.forceRefresh,
      });
    }

    growthTasks.push({
      task_id: taskId,
      target_capability: plan.theme,
      reason: truncate(reasonFor(plan, contexts), 760),
      related_job_version_ids: jobIdsOf(plan.mentions),
      source_feedback: plan.mentions.map(citationOf),
      learning_content: detail.learning,
      practice_task: detail.practice,
      recommend_competition_or_oss: detail.recommendCompetition,
      competition_or_oss_note: detail.note,
      estimated_effort: detail.effort,
      deliverable: detail.deliverable,
      acceptance_criteria: detail.acceptance,
      re_evaluation: `完成后把交付物加入材料并重新确认披露范围，材料版本 +1 后向相关岗位重新投递，由招聘方 Agent 按同一能力模型重新评估该项。`,
      zhihu_resources: zhihu?.resources ?? [],
      zhihu_meta: zhihu?.meta ?? null,
    });
  }

  const humanConfirmed = contexts.filter((c) => c.decision !== null).length;
  const infoInsufficient = contexts.filter(
    (c) => c.assessment.info_insufficient,
  ).length;

  // 整体置信度取各岗位置信度的最小值与均值的折中，并按样本量打折。
  // 刻意不做分数平均：样本只有几个岗位，平均分会掩盖岗位标准差异。
  const confidences = contexts.map((c) => c.assessment.confidence);
  const minConfidence = Math.min(...confidences);
  const meanConfidence =
    confidences.reduce((sum, v) => sum + v, 0) / confidences.length;
  const sampleFactor = Math.min(1, contexts.length / 5);
  const overall = round(
    (minConfidence * 0.6 + meanConfidence * 0.4) * (0.7 + 0.3 * sampleFactor),
    3,
  );

  const sources = [
    ...new Set(
      contexts.map((c) =>
        c.decision ? "招聘方反馈（真人确认）" : "招聘方 Agent 推断",
      ),
    ),
  ];

  const report: GrowthReport = {
    report_id: makeId("report"),
    candidate_agent_id: input.candidateAgentId,
    sample_size: contexts.length,
    human_confirmed_count: humanConfirmed,
    agent_inferred_count: contexts.length - humanConfirmed,
    info_insufficient_count: infoInsufficient,
    feedback_sources: sources,
    overall_confidence: overall,
    confidence_note: truncate(
      [
        `样本仅 ${contexts.length} 个岗位，其中 ${humanConfirmed} 个有招聘方真人确认，${contexts.length - humanConfirmed} 个为招聘方 Agent 推断。`,
        `${infoInsufficient} 个岗位存在信息不足的能力项。`,
      "本报告只反映这几个岗位按各自能力模型给出的结论，不能据此推断整体就业市场，也未对不同岗位的分数做平均。",
      ].join(""),
      560,
    ),
    analysis_mode: analysis.meta.mode,
    analysis_note: analysis.data.analysis_note,
    funnel: {
      authorized: input.authorizedCount,
      dispatched: input.applications.filter((a) =>
        ["dispatched", "in_dialogue", "assessed", "human_confirmed"].includes(
          a.state,
        ),
      ).length,
      assessed: contexts.length,
      human_confirmed: humanConfirmed,
      invited: input.decisions.filter((d) => d.decision === "interview_invited")
        .length,
    },
    signals,
    growth_tasks: growthTasks,
    created_at: nowIso(),
  };

  const parsed = GrowthReportSchema.safeParse(report);
  if (!parsed.success) {
    return {
      ok: false,
      blockers: [
        `成长报告未通过 schema 校验：${parsed.error.issues[0]?.message ?? "未知原因"}`,
      ],
      report: null,
    };
  }

  return { ok: true, blockers: [], report: parsed.data };
}
