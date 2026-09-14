import type { AssessmentJudgment } from "@/lib/engine/assessment";
import { answerEvidenceId } from "@/lib/engine/evidence-pool";

/**
 * 预置 Demo 的评估素材。只提供 fit_score / completeness / finding 等"观察"，
 * 分数、建议、状态仍由 src/lib/engine/scoring.ts 的确定性规则计算。
 *
 * 三个岗位的结论刻意来自不同原因：
 * - 岗位 A：关键能力有 L3 证据支撑，规则判定为建议邀约。
 * - 岗位 B：求职者自己确认缺少企业客户经历与真实业务指标，属于已确认的能力差距。
 * - 岗位 C：硬性条件"可运行作品"当前无法核验，属于证据不足，规则判定为人工复核。
 */
export const DEMO_JUDGMENTS: Record<string, AssessmentJudgment> = {
  jv_job_a_v1: {
    criteria: [
      {
        criterion_id: "jv_job_a_v1_c1",
        fit_score: 92,
        completeness: 95,
        evidence_ids: ["ev_1", "ev_2", answerEvidenceId("turn_1")],
        finding:
          "有一手访谈经历且方法可核验：分层抽样 14 位用户、自写脚本、采用回溯真实使用过程的提问方式，并将 37 条原始反馈归纳为 6 类问题后确定优先级。符合本岗位要求的一手访谈证据标准。",
        hard_status: "met",
        hard_note:
          "满足一手访谈的硬性要求，访谈样本量、选样方式与归纳过程均有材料与面试回答互相印证。",
      },
      {
        criterion_id: "jv_job_a_v1_c2",
        fit_score: 90,
        completeness: 92,
        evidence_ids: ["ev_3", "ev_4", answerEvidenceId("turn_2")],
        finding:
          "闭环完整：在排期受限时依据反馈频次与技术依赖度取舍，功能于 2025.10 上线，上线后用埋点做同群体对照，讲解完成率 41%→63%，并在复盘文档中明确记录未完成需求。",
        hard_status: "met",
        hard_note: "需求到上线到复盘的完整闭环有可核验的指标与文档证据。",
      },
      {
        criterion_id: "jv_job_a_v1_c3",
        fit_score: 80,
        completeness: 80,
        evidence_ids: ["ev_5"],
        finding:
          "能识别模型在教务类事实问题上的编造风险，并给出「该类信息不走模型、直接查库并显示来源」的产品兜底方案，符合本岗位不要求工程细节的证据标准。",
        hard_status: null,
        hard_note: "",
      },
      {
        criterion_id: "jv_job_a_v1_c4",
        fit_score: 85,
        completeness: 90,
        evidence_ids: ["ev_4"],
        finding:
          "复盘文档包含需求背景、方案取舍、上线数据与未解决问题，并有脱敏节选可查，说明文档结构能减少反复确认。",
        hard_status: null,
        hard_note: "",
      },
      {
        criterion_id: "jv_job_a_v1_c5",
        fit_score: 75,
        completeness: 75,
        evidence_ids: ["ev_11", "ev_5"],
        finding:
          "有自学 prompt 工程并应用到校园项目的记录，主动性可见；但自述未独立开发完整应用，自驱范围主要在产品与 prompt 侧。",
        hard_status: null,
        hard_note: "",
      },
    ],
    strengths: [
      "一手用户访谈的方法与样本可核验，不是泛泛的「做过调研」。",
      "具备完整的需求到上线到数据复盘闭环，并保留了指标口径说明。",
      "复盘时主动标注未解决需求，文档习惯符合岗位预期。",
    ],
    evidence_gaps: [
      "AI 能力边界的判断只有单一项目案例，样本偏少。",
      "自驱证据集中在产品与 prompt 侧，缺少跨职能主动推动的例子。",
    ],
    next_actions: [
      "面试中追问访谈结论到需求优先级的推导细节。",
      "确认讲解完成率指标的统计口径与对照方式。",
    ],
  },
  jv_job_b_v1: {
    criteria: [
      {
        criterion_id: "jv_job_b_v1_c1",
        fit_score: 30,
        completeness: 85,
        evidence_ids: ["ev_9"],
        finding:
          "求职者已确认没有面向企业客户独立负责需求梳理的经历，仅旁听过两次客户沟通会。该结论来自求职者本人确认的材料，而非材料缺失导致的无法判断。",
        hard_status: "not_met",
        hard_note:
          "本岗位要求有面向企业客户的具体项目经历并能独立完成需求梳理。求职者本人确认当前不具备该经历，因此判定为不满足；这是已确认的经历范围差异，不是证据缺失。",
      },
      {
        criterion_id: "jv_job_b_v1_c2",
        fit_score: 35,
        completeness: 88,
        evidence_ids: ["ev_10", answerEvidenceId("turn_3")],
        finding:
          "可提供的量化结果只有 C 端使用行为指标（讲解完成率 41%→63%，含同群体对照）。求职者确认没有收入、续约等真实业务场景指标经验，也未接触过客户业务数据。按本岗位「需要真实业务场景指标」的证据标准，现有证据不足以支撑该项。",
        hard_status: "not_met",
        hard_note:
          "岗位在追问中已明确校园或 C 端使用量数据只能作为参考。求职者确认的指标范围仅限 C 端行为指标，与该证据标准存在明确差距。",
      },
      {
        criterion_id: "jv_job_b_v1_c3",
        fit_score: 62,
        completeness: 65,
        evidence_ids: ["ev_3", answerEvidenceId("turn_2")],
        finding:
          "有与研发对齐 3 轮并推动功能按期上线的经历，说明具备基本协作推进能力；但协作角色集中在内部研发，缺少销售、实施与客户方多角色协调的证据，无法判断在交付场景下的表现。",
        hard_status: null,
        hard_note: "",
      },
      {
        criterion_id: "jv_job_b_v1_c4",
        fit_score: 70,
        completeness: 60,
        evidence_ids: ["ev_5"],
        finding:
          "有判断模型不可靠并改为直接查库的案例，体现了对 AI 方案可行性的判断；但该案例发生在自有产品内部，缺少面向客户改写或拒绝需求的经历。",
        hard_status: null,
        hard_note: "",
      },
      {
        criterion_id: "jv_job_b_v1_c5",
        fit_score: 45,
        completeness: 50,
        evidence_ids: ["ev_6"],
        finding:
          "材料中没有面向客户方管理者汇报或提案的记录，现有表达证据集中在内部文档与项目说明。",
        hard_status: null,
        hard_note: "",
      },
    ],
    strengths: [
      "有完整的需求到上线执行经历，内部协作推进能力可核验。",
      "对模型能力边界有实际判断案例。",
    ],
    evidence_gaps: [
      "缺少面向企业客户的场景经历，无法评估企业流程梳理能力。",
      "量化结果停留在 C 端行为指标，缺少真实业务场景的指标定义与基线。",
      "跨角色协作证据仅覆盖内部研发，交付场景的多方协调无证据。",
    ],
    next_actions: [
      "若后续考虑，需要候选人补充任一真实业务场景的指标定义与基线数据。",
      "建议候选人先取得面向组织客户的流程梳理经历再重新投递。",
    ],
  },
  jv_job_c_v1: {
    criteria: [
      {
        criterion_id: "jv_job_c_v1_c1",
        fit_score: 40,
        completeness: 70,
        evidence_ids: ["ev_8", answerEvidenceId("turn_4")],
        finding:
          "求职者确认在校园项目中承担 prompt 与需求部分，但原部署已随学期结束下线，当前没有可访问、可运行的链接，只能提供文档与截图。本岗位要求可运行作品并能指出本人实现部分，现有材料无法完成核验。",
        hard_status: "insufficient_evidence",
        hard_note:
          "硬性条件要求可访问、可运行的作品链接。当前无法访问原部署，无法核验运行状态与本人实现范围，因此判定为证据不足，不判定为不具备该能力。",
      },
      {
        criterion_id: "jv_job_c_v1_c2",
        fit_score: 55,
        completeness: 80,
        evidence_ids: ["ev_7", answerEvidenceId("turn_5")],
        finding:
          "求职者确认校园项目没有正式评测集，使用十余条自拟问题手动比较，并已主动指出样本量小与主观判断的局限。对失败模式有实际发现（教务类事实编造），但缺少可重复的评测流程与指标定义。",
        hard_status: null,
        hard_note: "",
      },
      {
        criterion_id: "jv_job_c_v1_c3",
        fit_score: 60,
        completeness: 65,
        evidence_ids: ["ev_5", "ev_11"],
        finding:
          "能基于模型表现提出不走模型的实现方案，说明具备一定技术沟通基础；但材料未显示与工程同学就实现方案产生过具体讨论并影响结论的过程，该项证据不完整。",
        hard_status: null,
        hard_note: "",
      },
      {
        criterion_id: "jv_job_c_v1_c4",
        fit_score: 72,
        completeness: 70,
        evidence_ids: ["ev_3", answerEvidenceId("turn_2")],
        finding:
          "有明确的功能取舍决策：在排期受限时放弃推荐下一题、优先讲解分段，依据是反馈频次与技术依赖度，并在复盘中记录未做原因。符合本岗位对产品判断的证据标准。",
        hard_status: null,
        hard_note: "",
      },
      {
        criterion_id: "jv_job_c_v1_c5",
        fit_score: 20,
        completeness: 40,
        evidence_ids: ["ev_11"],
        finding:
          "材料中没有开源贡献、技术写作或公开分享的可查记录，仅有校内案例比赛三等奖。",
        hard_status: null,
        hard_note: "",
      },
    ],
    strengths: [
      "产品取舍判断有明确依据并留有书面记录。",
      "能主动指出自己评测方法的局限，对可靠性有基本意识。",
    ],
    evidence_gaps: [
      "硬性条件「可运行作品」当前无法访问，无法核验运行状态与本人实现范围。",
      "缺少可重复的评测流程与指标定义。",
      "缺少与工程同学就实现方案讨论并影响结论的具体记录。",
    ],
    next_actions: [
      "请候选人重新部署校园项目或提交任一可运行的小型作品链接，并标注本人实现部分。",
      "人工复核时确认代码贡献的实际范围。",
    ],
  },
};

/** 面试回答摘要对应的证据等级，由平台按回答可核验程度设定。 */
export const DEMO_ANSWER_LEVELS: Record<string, "L0" | "L1" | "L2" | "L3"> = {
  turn_1: "L3",
  turn_2: "L3",
  turn_3: "L2",
  turn_4: "L2",
  turn_5: "L2",
};
