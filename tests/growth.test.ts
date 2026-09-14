import { describe, expect, it } from "vitest";
import { composeAssessment } from "@/lib/engine/assessment";
import {
  buildGrowthReport,
  buildSignals,
  planTasks,
  type JobContext,
} from "@/lib/engine/growth";
import { DEMO_JUDGMENTS } from "@/lib/demo/judgments";
import { PRESET_JOB_VERSIONS } from "@/lib/demo/preset-jobs";
import { defaultDisclosure, demoEvidencePool } from "@/lib/demo/scenario";
import { resetZhihuProvider } from "@/lib/providers/zhihu";
import type {
  Application,
  EmployerDecision,
  JobAssessment,
} from "@/lib/schema/domain";
import { FeedbackCategory } from "@/lib/schema/enums";

const JOB_IDS = ["jv_job_a_v1", "jv_job_b_v1", "jv_job_c_v1"] as const;

function jobOf(jobVersionId: string) {
  return PRESET_JOB_VERSIONS.find((j) => j.job_version_id === jobVersionId)!;
}

function assessmentOf(jobVersionId: string): JobAssessment {
  return composeAssessment({
    assessmentId: `as_${jobVersionId}`,
    taskId: `task_${jobVersionId}`,
    job: jobOf(jobVersionId),
    candidateAgentId: "ca_demo",
    judgment: DEMO_JUDGMENTS[jobVersionId],
    evidencePool: demoEvidencePool(defaultDisclosure()),
  });
}

/** 只有岗位 A 有招聘方真人确认，B/C 保持 Agent 推断。 */
function decisionOf(jobVersionId: string): EmployerDecision {
  return {
    decision_id: `dec_${jobVersionId}`,
    task_id: `task_${jobVersionId}`,
    job_version_id: jobVersionId,
    decision: "interview_invited",
    reason: "证据支撑产品闭环，安排一轮面试",
    overrode_agent: false,
    override_reason: "",
    decided_by: "hr_demo",
    decided_at: new Date().toISOString(),
    source: "EmployerConfirmedFeedback",
  };
}

function contexts(): JobContext[] {
  return JOB_IDS.map((id) => ({
    job: jobOf(id),
    assessment: assessmentOf(id),
    decision: id === "jv_job_a_v1" ? decisionOf(id) : null,
  }));
}

function applications(): Application[] {
  const now = new Date().toISOString();
  return JOB_IDS.map((id) => ({
    application_id: `app_${id}`,
    batch_id: "batch_demo",
    candidate_agent_id: "ca_demo",
    job_version_id: id,
    state: "assessed" as const,
    task_id: `task_${id}`,
    created_at: now,
    updated_at: now,
  }));
}

async function report(overrides: { authorizedCount?: number } = {}) {
  resetZhihuProvider();
  const ctxs = contexts();
  return buildGrowthReport({
    candidateAgentId: "ca_demo",
    jobs: ctxs.map((c) => c.job),
    assessments: ctxs.map((c) => c.assessment),
    decisions: ctxs.flatMap((c) => (c.decision ? [c.decision] : [])),
    applications: applications(),
    authorizedCount: overrides.authorizedCount ?? 3,
    userId: "user_demo",
    skipZhihu: true,
  });
}

describe("四类反馈信号可区分且都能引到来源", () => {
  const signals = buildSignals(contexts());

  it("四类反馈在预置案例中都能产出", () => {
    const produced = new Set(signals.map((s) => s.category));
    for (const category of FeedbackCategory.options) {
      expect(produced, `缺少分类 ${category}`).toContain(category);
    }
  });

  it("每条信号都至少引用一条带来源标签的原始反馈", () => {
    expect(signals.length).toBeGreaterThan(0);
    for (const signal of signals) {
      expect(signal.citations.length).toBeGreaterThan(0);
      for (const citation of signal.citations) {
        expect(citation.quote.length).toBeGreaterThan(0);
        expect(["EmployerConfirmedFeedback", "JobAgentInference"]).toContain(
          citation.source,
        );
        expect(signal.job_version_ids).toContain(citation.job_version_id);
      }
    }
  });

  it("只有真人确认过的岗位才标为招聘方反馈，其余为 Agent 推断", () => {
    for (const signal of signals) {
      for (const citation of signal.citations) {
        const expected =
          citation.job_version_id === "jv_job_a_v1"
            ? "EmployerConfirmedFeedback"
            : "JobAgentInference";
        expect(citation.source).toBe(expected);
      }
    }
  });

  it("跨岗位重复信号覆盖 2 个以上岗位，岗位特有要求只覆盖 1 个", () => {
    const repeated = signals.filter((s) => s.category === "repeated_signal");
    const specific = signals.filter((s) => s.category === "job_specific");
    expect(repeated.length).toBeGreaterThan(0);
    expect(specific.length).toBeGreaterThan(0);
    for (const s of specific) {
      expect(s.job_version_ids).toHaveLength(1);
    }
  });

  it("材料证据问题只说无法判断，不写成不具备能力", () => {
    const evidence = signals.filter((s) => s.category === "evidence_problem");
    expect(evidence.length).toBeGreaterThan(0);
    for (const s of evidence) {
      expect(s.statement).toMatch(/信息不足|无可核验|没有可核验/);
      expect(s.statement).toContain("不代表不具备该能力");
      // 「不具备该能力」只允许出现在「不代表」之后，不能作为独立结论。
      expect(s.statement).not.toMatch(/(?<!不代表)不具备该能力/);
    }
  });

  it("冲突反馈同时引用支撑方和存疑方，且说明差异来自岗位标准", () => {
    const conflicting = signals.filter((s) => s.category === "conflicting");
    expect(conflicting.length).toBeGreaterThan(0);
    for (const s of conflicting) {
      expect(s.job_version_ids.length).toBeGreaterThanOrEqual(2);
      expect(s.statement).toContain("岗位标准不同");
      expect(s.statement).toContain("不能合并成一个结论");
    }
  });

  it("可运行作品的证据缺口归为材料证据问题，而不是能力差距", () => {
    const runnable = signals.find((s) =>
      s.statement.includes("可运行作品与产出证据"),
    );
    expect(runnable?.category).toBe("evidence_problem");
  });
});

describe("成长任务", () => {
  it("产出 1 到 3 项任务，优先补能产生新证据的方向", () => {
    const plans = planTasks(contexts());
    expect(plans.length).toBeGreaterThanOrEqual(1);
    expect(plans.length).toBeLessThanOrEqual(3);
    expect(plans[0].category).toBe("evidence_problem");
  });

  it("每项任务都带齐 PRD 要求的全部字段", async () => {
    const outcome = await report();
    expect(outcome.ok).toBe(true);
    const tasks = outcome.report!.growth_tasks;
    expect(tasks.length).toBeGreaterThanOrEqual(1);
    for (const task of tasks) {
      expect(task.target_capability.length).toBeGreaterThan(0);
      expect(task.reason.length).toBeGreaterThan(0);
      expect(task.related_job_version_ids.length).toBeGreaterThan(0);
      expect(task.source_feedback.length).toBeGreaterThan(0);
      expect(task.learning_content.length).toBeGreaterThan(0);
      expect(task.practice_task.length).toBeGreaterThan(0);
      expect(typeof task.recommend_competition_or_oss).toBe("boolean");
      expect(task.estimated_effort.length).toBeGreaterThan(0);
      expect(task.deliverable.length).toBeGreaterThan(0);
      expect(task.acceptance_criteria.length).toBeGreaterThan(0);
      expect(task.re_evaluation.length).toBeGreaterThan(0);
    }
  });

  it("实践任务指向可核验产出，而不是只推荐课程", async () => {
    const outcome = await report();
    const tasks = outcome.report!.growth_tasks;
    expect(tasks.some((t) => t.recommend_competition_or_oss)).toBe(true);
    for (const task of tasks) {
      expect(task.practice_task).toMatch(/作品|实践|开源|输出|复盘/);
      expect(task.deliverable).toMatch(/链接|文档|内容|贡献|记录/);
    }
  });

  it("复评方式说明如何重新产生证据并重新评估", async () => {
    const outcome = await report();
    for (const task of outcome.report!.growth_tasks) {
      expect(task.re_evaluation).toMatch(/重新评估|重新投递/);
    }
  });
});

describe("报告口径", () => {
  it("展示样本数、来源、真人确认数、Agent 推断数、信息不足与整体置信度", async () => {
    const outcome = await report();
    const r = outcome.report!;
    expect(r.sample_size).toBe(3);
    expect(r.human_confirmed_count).toBe(1);
    expect(r.agent_inferred_count).toBe(2);
    expect(r.human_confirmed_count + r.agent_inferred_count).toBe(r.sample_size);
    expect(r.info_insufficient_count).toBeGreaterThanOrEqual(0);
    expect(r.feedback_sources).toContain("招聘方反馈（真人确认）");
    expect(r.feedback_sources).toContain("招聘方 Agent 推断");
    expect(r.overall_confidence).toBeGreaterThan(0);
    expect(r.overall_confidence).toBeLessThanOrEqual(1);
  });

  it("明确声明不做分数平均、不推断整体市场", async () => {
    const outcome = await report();
    const note = outcome.report!.confidence_note;
    expect(note).toContain("不能据此推断整体就业市场");
    expect(note).toContain("未对不同岗位的分数做平均");
  });

  it("整体置信度不等于各岗位置信度的算术平均", async () => {
    const ctxs = contexts();
    const mean =
      ctxs.reduce((sum, c) => sum + c.assessment.confidence, 0) / ctxs.length;
    const outcome = await report();
    expect(outcome.report!.overall_confidence).not.toBeCloseTo(mean, 3);
  });

  it("整体置信度不高于最弱岗位与均值的折中上限", async () => {
    const ctxs = contexts();
    const min = Math.min(...ctxs.map((c) => c.assessment.confidence));
    const outcome = await report();
    // 样本不足会额外打折，因此不可能超过均值。
    const mean =
      ctxs.reduce((sum, c) => sum + c.assessment.confidence, 0) / ctxs.length;
    expect(outcome.report!.overall_confidence).toBeLessThanOrEqual(mean);
    expect(outcome.report!.overall_confidence).toBeGreaterThanOrEqual(min * 0.5);
  });

  it("漏斗数据与投递、评估、真人确认一致", async () => {
    const outcome = await report();
    const funnel = outcome.report!.funnel;
    expect(funnel.authorized).toBe(3);
    expect(funnel.dispatched).toBe(3);
    expect(funnel.assessed).toBe(3);
    expect(funnel.human_confirmed).toBe(1);
    expect(funnel.invited).toBe(1);
  });

  it("授权岗位未全部返回结果时不生成报告", async () => {
    const outcome = await report({ authorizedCount: 5 });
    expect(outcome.ok).toBe(false);
    expect(outcome.report).toBeNull();
    expect(outcome.blockers.join(" ")).toMatch(/等全部岗位返回/);
  });
});

/**
 * 这两个用例会真实走一次知乎 Provider 的降级链（无密钥时落到 Demo Cache），
 * 涉及真实网络请求与超时重试，因此需要显式放宽超时。
 */
const ZHIHU_TEST_TIMEOUT_MS = 90_000;

describe("知乎资源接入", () => {
  it("生成报告时为成长任务附带知乎资源与数据状态标签", async () => {
    resetZhihuProvider();
    const ctxs = contexts();
    const outcome = await buildGrowthReport({
      candidateAgentId: "ca_demo",
      jobs: ctxs.map((c) => c.job),
      assessments: ctxs.map((c) => c.assessment),
      decisions: ctxs.flatMap((c) => (c.decision ? [c.decision] : [])),
      applications: applications(),
      authorizedCount: 3,
      userId: "user_demo",
    });

    expect(outcome.ok).toBe(true);
    const tasks = outcome.report!.growth_tasks;
    // 至少一项任务真实接上了知乎能力（无密钥时降级为 Demo Cache）。
    const withResources = tasks.filter((t) => t.zhihu_resources.length > 0);
    expect(withResources.length).toBeGreaterThan(0);

    for (const task of withResources) {
      expect(task.zhihu_meta).not.toBeNull();
      expect([
        "live",
        "server_cache",
        "demo_cache",
        "offline_fallback",
      ]).toContain(task.zhihu_meta!.data_status);
      expect(task.zhihu_meta!.cache_key).toContain(task.task_id);
      expect(task.zhihu_meta!.fetched_at.length).toBeGreaterThan(0);

      for (const resource of task.zhihu_resources) {
        // 只展示真实返回的字段，缺失的一律为 null，不允许编造。
        expect(resource.title.length).toBeGreaterThan(0);
        expect(resource.fetched_at.length).toBeGreaterThan(0);
        expect(resource.api_name.length).toBeGreaterThan(0);
        expect(resource.why_for_task).toContain(task.target_capability);
        expect(resource.data_status).toBe(task.zhihu_meta!.data_status);
      }
    }
  }, ZHIHU_TEST_TIMEOUT_MS);

  it("同一批任务共享缓存与计数，不会重复穿透调用", async () => {
    resetZhihuProvider();
    const ctxs = contexts();
    const input = {
      candidateAgentId: "ca_demo",
      jobs: ctxs.map((c) => c.job),
      assessments: ctxs.map((c) => c.assessment),
      decisions: ctxs.flatMap((c) => (c.decision ? [c.decision] : [])),
      applications: applications(),
      authorizedCount: 3,
      userId: "user_demo",
    };
    const first = await buildGrowthReport(input);
    const second = await buildGrowthReport(input);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    const budget = second.report!.growth_tasks[0]?.zhihu_meta?.daily_budget;
    if (typeof budget === "number") {
      const calls = second.report!.growth_tasks[0]!.zhihu_meta!.calls_today;
      expect(calls).toBeLessThanOrEqual(budget + 1);
    }
  }, ZHIHU_TEST_TIMEOUT_MS);
});
