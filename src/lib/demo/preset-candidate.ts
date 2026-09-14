import type {
  CandidateProfile,
  InterviewSession,
  PortfolioItem,
} from "@/lib/schema/domain";

const UPDATED_AT = "2026-01-05T03:00:00.000Z";

export const PRESET_RESUME_TEXT = `林澈｜求职方向：初级 AI 应用产品经理
教育：某双一流高校 信息管理与信息系统 本科（2022-2026）

实习经历
2025.07-2025.11 某在线教育公司 产品实习生
- 负责「AI 错题讲解」功能的需求梳理与上线跟进。我独立完成了 14 位高中生用户的一对一访谈，
  访谈脚本自己写的，按年级和成绩段分层选人，把 37 条原始反馈归纳成 6 类问题，
  最终确认「讲解太长看不完」和「不知道下一步练什么」是最高优先级。
- 输出需求文档并跟研发对齐 3 轮，功能在 2025.10 上线。上线后两周我拉了埋点数据，
  讲解完成率从 41% 提升到 63%，我自己做了对照，只看新老版本同一批用户群体。
- 写了一份上线复盘文档，指出「下一步练什么」这个需求没有在本期解决，建议放到下一迭代。

校园项目
2025.03-2025.06 校园 AI 学习助手（3 人团队，我负责产品与 prompt）
- 做了一个基于大模型的课程问答助手，我负责需求定义、prompt 设计和上线后的问题收集。
- 我发现模型在涉及具体课程时间地点时会编造答案，于是在产品上加了「教务信息不走模型，
  直接查数据库」的兜底规则，并在回答里显示信息来源。
- 项目在班级内部试用，大约 60 人用过，我们收了 20 多条反馈。

其他
- 自学了 prompt 工程和基础的 Python，能改通别人的脚本，但没有独立开发完整应用的经历。
- 参加过一次校内产品案例比赛，拿了三等奖。
`;

export const PRESET_PROJECT_TEXT = `补充项目材料

关于校园 AI 学习助手的更多细节：
- 技术上是同学用 Python + 一个开源框架搭的，我参与了 prompt 的多轮修改。
- 我们没有做正式的评测集，主要靠人工试，试到觉得可以就上线了。
- 部署在同学的个人服务器上，学期结束后就下线了，现在链接打不开。

关于企业客户经验：
- 我没有面向企业客户的项目经历，实习是 C 端产品。
- 实习期间旁听过两次客户沟通会，但没有独立负责过需求梳理。

关于业务指标：
- 除了讲解完成率 41% 到 63% 这一个指标，其他项目我没有系统追踪过数据。
- 校园项目只有大概的使用人数，没有留存或转化数据。
`;

export const PRESET_PORTFOLIO: PortfolioItem[] = [
  {
    item_id: "pf_1",
    title: "AI 错题讲解 上线复盘文档（脱敏节选）",
    url: "https://example.com/lin-che/retro-ai-explain",
    note: "含需求背景、方案取舍、上线数据与未解决问题，实习公司允许分享脱敏版本。",
    confirmed: true,
  },
  {
    item_id: "pf_2",
    title: "校园 AI 学习助手 项目说明（无可运行链接）",
    url: "https://example.com/lin-che/campus-assistant-doc",
    note: "只有文档和截图，原部署已下线，当前无法运行。",
    confirmed: true,
  },
];

/**
 * 预置求职者。证据分布刻意不均：
 * 用户研究与产品闭环有 L3 证据，企业客户与业务量化是 L0/L1，可运行作品是 L1（已下线）。
 */
export const PRESET_CANDIDATE: CandidateProfile = {
  candidate_id: "cand_lin_che",
  display_name: "林澈",
  target_role: "初级 AI 应用产品经理",
  resume_text: PRESET_RESUME_TEXT,
  project_text: PRESET_PROJECT_TEXT,
  portfolio: PRESET_PORTFOLIO,
  evidence: [
    {
      evidence_id: "ev_1",
      claim: "独立完成 14 位高中生用户的一对一访谈，自写访谈脚本并按年级成绩分层选人",
      quote:
        "我独立完成了 14 位高中生用户的一对一访谈，访谈脚本自己写的，按年级和成绩段分层选人",
      material_ref: "简历 / 实习经历",
      level: "L3",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_2",
      claim: "把 37 条原始反馈归纳为 6 类问题并确认最高优先级需求",
      quote:
        "把 37 条原始反馈归纳成 6 类问题，最终确认「讲解太长看不完」和「不知道下一步练什么」是最高优先级",
      material_ref: "简历 / 实习经历",
      level: "L3",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_3",
      claim: "完成需求到上线的闭环，并用埋点数据做了一轮复盘",
      quote:
        "功能在 2025.10 上线。上线后两周我拉了埋点数据，讲解完成率从 41% 提升到 63%，我自己做了对照，只看新老版本同一批用户群体",
      material_ref: "简历 / 实习经历",
      level: "L3",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_4",
      claim: "输出上线复盘文档，明确指出本期未解决的需求并给出迭代建议",
      quote:
        "写了一份上线复盘文档，指出「下一步练什么」这个需求没有在本期解决，建议放到下一迭代",
      material_ref: "简历 / 实习经历",
      level: "L3",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_5",
      claim: "识别模型在教务类问题上的编造风险，并设计不走模型的产品兜底规则",
      quote:
        "我发现模型在涉及具体课程时间地点时会编造答案，于是在产品上加了「教务信息不走模型，直接查数据库」的兜底规则，并在回答里显示信息来源",
      material_ref: "简历 / 校园项目",
      level: "L2",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_6",
      claim: "校园 AI 学习助手曾有约 60 人试用并收集 20 余条反馈",
      quote: "项目在班级内部试用，大约 60 人用过，我们收了 20 多条反馈",
      material_ref: "简历 / 校园项目",
      level: "L1",
      source: "CandidateClaim",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_7",
      claim: "校园项目没有正式评测集，效果验证靠人工试用",
      quote: "我们没有做正式的评测集，主要靠人工试，试到觉得可以就上线了",
      material_ref: "补充材料 / 校园项目细节",
      level: "L2",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_8",
      claim: "校园项目原部署已下线，目前没有可运行的作品链接",
      quote: "部署在同学的个人服务器上，学期结束后就下线了，现在链接打不开",
      material_ref: "补充材料 / 校园项目细节",
      level: "L2",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_9",
      claim: "没有面向企业客户独立负责需求梳理的经历",
      quote:
        "我没有面向企业客户的项目经历，实习是 C 端产品。实习期间旁听过两次客户沟通会，但没有独立负责过需求梳理",
      material_ref: "补充材料 / 企业客户经验",
      level: "L2",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_10",
      claim: "除讲解完成率外没有系统追踪过其他业务指标",
      quote:
        "除了讲解完成率 41% 到 63% 这一个指标，其他项目我没有系统追踪过数据。校园项目只有大概的使用人数，没有留存或转化数据",
      material_ref: "补充材料 / 业务指标",
      level: "L2",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
    {
      evidence_id: "ev_11",
      claim: "自学 prompt 工程与基础 Python，能修改脚本但未独立开发完整应用",
      quote:
        "自学了 prompt 工程和基础的 Python，能改通别人的脚本，但没有独立开发完整应用的经历",
      material_ref: "简历 / 其他",
      level: "L2",
      source: "CandidateFact",
      confirmed: true,
      edited_by_user: false,
    },
  ],
  materials_confirmed: true,
  updated_at: UPDATED_AT,
};

/** 预置模拟面试。5 题覆盖三个岗位关注的不同能力。 */
export const PRESET_INTERVIEW: InterviewSession = {
  session_id: "sess_lin_che_1",
  candidate_id: "cand_lin_che",
  target_job_version_id: null,
  turns: [
    {
      turn_id: "turn_1",
      question: "请描述一次你主导的用户研究：样本怎么选、问了什么、结论如何影响了需求？",
      linked_criterion_id: "jv_job_a_v1_c1",
      answer_mode: "text",
      raw_answer:
        "实习时我负责 AI 错题讲解。我按年级和成绩段分了四层，每层选 3 到 4 个人，一共访谈 14 位高中生。脚本里我主要问他们最近一次看讲解的完整过程，而不是直接问喜不喜欢。归纳出来最集中的两个问题是讲解太长和不知道接下来练什么。因为第一个问题出现频次最高而且改动成本低，我们本期先做了分段折叠讲解。",
      transcript_confirmed: true,
      answer_summary:
        "分层抽样访谈 14 位用户，采用回溯真实使用过程的提问方式，依据出现频次与改动成本确定本期优先级。",
      summary_confirmed: true,
    },
    {
      turn_id: "turn_2",
      question: "举一个你从需求到上线再到复盘的完整例子，中间做过哪些取舍？",
      linked_criterion_id: "jv_job_a_v1_c2",
      answer_mode: "voice",
      raw_answer:
        "还是错题讲解这个功能。原本想同时做讲解分段和推荐下一题，但研发排期只够做一个。我选了讲解分段，因为访谈里这个问题被提到的次数多一倍，而且不依赖推荐算法。上线两周后我看埋点，讲解完成率从 41% 到 63%。我在复盘文档里写清楚推荐下一题没做，留到下一期。",
      transcript_confirmed: true,
      answer_summary:
        "在排期受限时依据反馈频次与技术依赖度取舍，先做讲解分段；上线后用完成率指标复盘，并明确记录未完成需求。",
      summary_confirmed: true,
    },
    {
      turn_id: "turn_3",
      question: "你负责过的项目里，最能代表业务价值的指标是什么？基线和结果分别是多少？",
      linked_criterion_id: "jv_job_b_v1_c2",
      answer_mode: "text",
      raw_answer:
        "只有讲解完成率这一个，基线 41%，两周后 63%。这个是 C 端的使用行为指标，不是收入或者续约之类的业务指标。企业客户那种交付效果指标我没有做过，也没有接触过客户的业务数据。",
      transcript_confirmed: true,
      answer_summary:
        "可提供的量化结果仅有 C 端使用行为指标（完成率 41%→63%），缺少收入、续约等企业业务指标经验。",
      summary_confirmed: true,
    },
    {
      turn_id: "turn_4",
      question: "请给出一个可运行的作品链接，并说明你亲手写了哪一部分？",
      linked_criterion_id: "jv_job_c_v1_c1",
      answer_mode: "text",
      raw_answer:
        "校园学习助手是我们三个人做的，代码主要是同学写的，我负责 prompt 和需求。部署在同学服务器上，学期结束下线了，现在没有可以打开的链接。我能提供的是项目文档和截图。",
      transcript_confirmed: true,
      answer_summary:
        "目前没有可运行的作品链接，原部署已下线；本人承担 prompt 与需求部分，代码由同学实现，可提供文档与截图。",
      summary_confirmed: true,
    },
    {
      turn_id: "turn_5",
      question: "你怎么评估一个 prompt 改动是否真的更好？评测集怎么来的？",
      linked_criterion_id: "jv_job_c_v1_c2",
      answer_mode: "voice",
      raw_answer:
        "校园项目里我们没有正式评测集，是我准备十几个常见问题手动试，觉得回答更清楚就采用。我知道这样不严谨，因为样本少而且是我自己判断的，容易偏。教务信息编造那个问题是我试出来的，后来才加了兜底。",
      transcript_confirmed: true,
      answer_summary:
        "使用十余条自拟问题手动比较，无正式评测集与量化指标；本人已识别样本量小与主观判断的局限。",
      summary_confirmed: true,
    },
  ],
  completed: true,
};
