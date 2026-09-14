import type { JobVersion } from "@/lib/schema/domain";

const CREATED_AT = "2026-01-05T02:00:00.000Z";

/**
 * 预置案例：初级 AI 应用产品经理。
 * 三个岗位在能力权重与证据标准上刻意不同，用于产出三种不同的 Agent 建议。
 */
export const PRESET_JOB_VERSIONS: JobVersion[] = [
  {
    job_version_id: "jv_job_a_v1",
    job_id: "job_a",
    version: 1,
    company_name: "启明智研",
    title: "初级 AI 应用产品经理（用户研究与产品闭环）",
    raw_input:
      "我们在做面向 C 端的 AI 学习助手，需要一个能自己跑用户访谈、把问题拆成需求、再跟进上线和数据复盘的产品新人。不要求带团队，但要能独立完成一个小闭环。",
    input_mode: "text",
    transcript_confirmed: true,
    summary:
      "面向 C 端 AI 学习助手方向，重点考察候选人是否能独立完成「用户问题发现 -> 需求定义 -> 上线 -> 数据复盘」的完整闭环，接受校园或实习级别的项目规模。",
    criteria: [
      {
        criterion_id: "jv_job_a_v1_c1",
        name: "用户研究与问题定义",
        type: "core_competency",
        description:
          "能设计并执行用户访谈或调研，把模糊反馈整理为可验证的问题陈述与优先级。",
        weight: 30,
        must_have: true,
        evidence_standard:
          "需要说明访谈样本量、提问方式、如何从原始反馈归纳出问题，以及最终形成的需求清单。",
        evaluation_questions: [
          "请描述一次你主导的用户研究：样本怎么选、问了什么、结论如何影响了需求？",
          "你如何判断一个用户反馈是真实需求还是个别偏好？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_a_v1_c2",
        name: "产品闭环推进",
        type: "core_competency",
        description: "能把需求推进到上线，并在上线后基于数据完成一轮复盘和迭代。",
        weight: 30,
        must_have: true,
        evidence_standard:
          "需要有一个可描述的完整闭环：需求背景、方案取舍、上线情况、上线后观察到的指标或用户行为变化。",
        evaluation_questions: [
          "举一个你从需求到上线再到复盘的完整例子，中间做过哪些取舍？",
          "上线之后你看了哪些指标，得出了什么结论？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_a_v1_c3",
        name: "AI 能力边界理解",
        type: "trainable",
        description:
          "理解大模型在产品中的能力与限制，知道哪些问题适合用 AI 解决、哪些需要兜底设计。",
        weight: 20,
        must_have: false,
        evidence_standard:
          "能举出具体的能力边界判断和相应的产品兜底方案，不要求工程实现细节。",
        evaluation_questions: [
          "在你的 AI 项目里，模型哪些地方不可靠？你在产品上怎么兜底？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_a_v1_c4",
        name: "书面表达与文档",
        type: "core_competency",
        description: "能写清楚需求文档与复盘文档，让研发和设计不需要反复确认。",
        weight: 12,
        must_have: false,
        evidence_standard: "有可展示的文档结构描述，或能说明文档如何减少沟通成本。",
        evaluation_questions: ["你的需求文档一般包含哪些部分？为什么这样组织？"],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_a_v1_c5",
        name: "自驱与学习速度",
        type: "bonus",
        description: "能在缺少指导的情况下自己找资料、找人、把事情推动起来。",
        weight: 8,
        must_have: false,
        evidence_standard: "有主动发起项目、自学新工具并落地的具体例子。",
        evaluation_questions: ["最近三个月你主动学了什么，并用在了什么地方？"],
        source: "JobRequirement",
      },
    ],
    clarifications: [
      {
        question_id: "jv_job_a_v1_q1",
        question: "这个岗位需要独立负责一个完整方向，还是配合资深产品做子模块？",
        why_it_matters: "决定「产品闭环推进」是硬性条件还是加分项。",
        answer: "需要独立负责一个小方向，规模可以小，但闭环必须完整。",
      },
      {
        question_id: "jv_job_a_v1_q2",
        question: "用户研究是否必须有一手访谈经验，二手数据分析是否可以替代？",
        why_it_matters: "影响用户研究项的证据标准。",
        answer: "必须有一手访谈经验，纯数据分析不算。",
      },
      {
        question_id: "jv_job_a_v1_q3",
        question: "是否要求候选人有 AI 工程背景？",
        why_it_matters: "决定 AI 能力边界理解的权重与是否硬性。",
        answer: "不要求工程背景，但要理解模型能力边界。",
      },
    ],
    confirmed: true,
    confirmed_at: CREATED_AT,
    created_at: CREATED_AT,
  },
  {
    job_version_id: "jv_job_b_v1",
    job_id: "job_b",
    version: 1,
    company_name: "远景数科",
    title: "初级 AI 应用产品经理（企业客户交付）",
    raw_input:
      "我们做 B 端 AI 客服与知识库交付，需要产品同学能进客户现场、把客户流程拆清楚、推动交付上线，并且用业务指标证明价值。客户方一般是运营总监级别。",
    input_mode: "voice",
    transcript_confirmed: true,
    summary:
      "B 端 AI 客服与知识库交付方向，重点考察企业客户场景理解、跨角色协作推动交付，以及用业务指标量化交付结果的能力。",
    criteria: [
      {
        criterion_id: "jv_job_b_v1_c1",
        name: "企业客户场景理解",
        type: "core_competency",
        description:
          "能理解企业内部流程与角色分工，把客户口述的流程整理成可落地的方案边界。",
        weight: 28,
        must_have: true,
        evidence_standard:
          "需要有面向企业客户（非个人用户）的具体项目经历，说明客户角色、流程环节与方案边界。",
        evaluation_questions: [
          "请描述一次你面向企业客户的需求梳理：客户方有哪些角色，你如何确认真实流程？",
          "企业客户的诉求和一线使用者的诉求冲突时你怎么处理？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_b_v1_c2",
        name: "业务结果量化",
        type: "core_competency",
        description:
          "能定义并追踪业务指标，用数据说明交付带来的业务价值，而不是只描述功能上线。",
        weight: 30,
        must_have: true,
        evidence_standard:
          "需要给出指标定义、基线数值、变化幅度与统计口径，能说明数据来源与可信度。",
        evaluation_questions: [
          "你负责过的项目里，最能代表业务价值的指标是什么？基线和结果分别是多少？",
          "你如何排除其他因素，确认指标变化和你的方案有关？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_b_v1_c3",
        name: "跨角色协作与交付推进",
        type: "core_competency",
        description: "能协调销售、实施、研发与客户方多角色，推动交付按期上线。",
        weight: 22,
        must_have: false,
        evidence_standard: "需要说明协作角色数量、冲突点与推进方式，有明确的时间结果。",
        evaluation_questions: [
          "举一个你推动多方协作的例子，最大的阻力是什么，你怎么解决的？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_b_v1_c4",
        name: "AI 方案可行性判断",
        type: "trainable",
        description: "能判断客户诉求是否适合用现有 AI 能力实现，并给出替代方案。",
        weight: 12,
        must_have: false,
        evidence_standard: "能给出一次「拒绝或改写客户需求」的具体判断过程。",
        evaluation_questions: ["有没有客户提了 AI 做不到的需求？你怎么回应的？"],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_b_v1_c5",
        name: "客户沟通表达",
        type: "bonus",
        description: "能面向客户中高层清晰表达方案与风险。",
        weight: 8,
        must_have: false,
        evidence_standard: "有面向客户方管理者汇报或提案的经历。",
        evaluation_questions: ["你对客户方管理者做过哪些汇报？他们最关心什么？"],
        source: "JobRequirement",
      },
    ],
    clarifications: [
      {
        question_id: "jv_job_b_v1_q1",
        question: "是否接受校园或 C 端项目的量化结果作为业务结果证据？",
        why_it_matters: "决定「业务结果量化」的证据标准严格程度。",
        answer: "需要真实业务场景的指标，校园项目的使用量数据只能作为参考。",
      },
      {
        question_id: "jv_job_b_v1_q2",
        question: "候选人是否需要独立面对客户，还是有资深同事带？",
        why_it_matters: "影响企业客户场景理解是否为硬性条件。",
        answer: "前期有人带，但需要能独立完成需求梳理，所以场景理解是硬性要求。",
      },
      {
        question_id: "jv_job_b_v1_q3",
        question: "交付周期一般多长，是否需要驻场？",
        why_it_matters: "影响跨角色协作项的评估问题设计。",
        answer: "单个项目 6 到 10 周，需要短期驻场。",
      },
    ],
    confirmed: true,
    confirmed_at: CREATED_AT,
    created_at: CREATED_AT,
  },
  {
    job_version_id: "jv_job_c_v1",
    job_id: "job_c",
    version: 1,
    company_name: "拾光实验室",
    title: "初级 AI 应用产品经理（技术理解与可运行作品）",
    raw_input:
      "我们是十来个人的 AI 工具团队，产品同学要能自己搭原型、看懂 prompt 与评测结果、和算法同学讨论实现方案。最好有能跑起来的作品。",
    input_mode: "text",
    transcript_confirmed: true,
    summary:
      "小团队 AI 工具方向，重点考察候选人是否具备可运行的作品产出能力、对 prompt 与评测的理解，以及与算法同学的技术沟通能力。",
    criteria: [
      {
        criterion_id: "jv_job_c_v1_c1",
        name: "可运行作品产出",
        type: "hard_requirement",
        description:
          "有可访问、可运行的作品（Demo、开源仓库或线上服务），能说明自己承担的实现部分。",
        weight: 30,
        must_have: true,
        evidence_standard:
          "需要提供可访问链接或仓库，并能指出哪些部分由本人实现，附带运行方式说明。",
        evaluation_questions: [
          "请给出一个可运行的作品链接，并说明你亲手写了哪一部分？",
          "这个作品现在还能跑起来吗？依赖什么服务？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_c_v1_c2",
        name: "Prompt 与评测理解",
        type: "core_competency",
        description:
          "理解 prompt 结构、失败模式与评测方法，能设计一套可重复的效果验证流程。",
        weight: 26,
        must_have: false,
        evidence_standard:
          "需要说明评测集构造方式、指标定义与迭代过程，而不是只说「效果变好了」。",
        evaluation_questions: [
          "你怎么评估一个 prompt 改动是否真的更好？评测集怎么来的？",
          "你遇到过哪些典型的模型失败模式？",
        ],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_c_v1_c3",
        name: "技术沟通能力",
        type: "core_competency",
        description: "能和算法/工程同学讨论实现方案，理解成本与可行性的权衡。",
        weight: 22,
        must_have: false,
        evidence_standard: "有与工程同学就实现方案产生过具体讨论并影响结论的例子。",
        evaluation_questions: ["举一次你和工程同学讨论技术方案的例子，结论是什么？"],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_c_v1_c4",
        name: "产品判断",
        type: "core_competency",
        description: "能在功能取舍中做出判断，说明为什么不做某些功能。",
        weight: 14,
        must_have: false,
        evidence_standard: "有明确的「砍掉某功能」的决策与理由。",
        evaluation_questions: ["你砍掉过哪个功能？依据是什么？"],
        source: "JobRequirement",
      },
      {
        criterion_id: "jv_job_c_v1_c5",
        name: "开源或社区参与",
        type: "bonus",
        description: "有开源贡献、技术写作或社区分享经历。",
        weight: 8,
        must_have: false,
        evidence_standard: "有可查的贡献记录、文章或分享链接。",
        evaluation_questions: ["你有没有开源贡献或公开的技术分享？"],
        source: "JobRequirement",
      },
    ],
    clarifications: [
      {
        question_id: "jv_job_c_v1_q1",
        question: "可运行作品是硬性门槛，还是有代码阅读能力即可？",
        why_it_matters: "决定该项是否作为硬性条件参与判断。",
        answer: "是硬性门槛，必须有能跑起来的东西。",
      },
      {
        question_id: "jv_job_c_v1_q2",
        question: "是否要求候选人独立完成模型评测，还是配合算法同学？",
        why_it_matters: "影响 prompt 与评测项的证据标准。",
        answer: "希望能自己搭简单评测集，复杂评测由算法同学负责。",
      },
      {
        question_id: "jv_job_c_v1_q3",
        question: "作品是个人项目还是团队项目更受认可？",
        why_it_matters: "影响证据归属的判断方式。",
        answer: "都可以，但必须能说清自己做了哪部分。",
      },
    ],
    confirmed: true,
    confirmed_at: CREATED_AT,
    created_at: CREATED_AT,
  },
];

/** 岗位进入候选列表的原因，授权页需要展示。 */
export const PRESET_JOB_MATCH_REASONS: Record<string, string> = {
  jv_job_a_v1:
    "岗位目标角色与你的求职方向一致，且你已确认的用户访谈与产品闭环证据命中该岗位两项高权重能力。",
  jv_job_b_v1:
    "岗位同属 AI 应用产品方向，你的项目涉及需求梳理与协作，但企业客户与业务指标维度的证据尚未覆盖，可用于验证差距。",
  jv_job_c_v1:
    "岗位强调可运行作品与技术理解，你提交了作品链接与 AI 项目材料，适合检验技术侧证据是否足够。",
};
