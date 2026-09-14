import { z } from "zod";

/**
 * 数据来源标签。PRD 要求：只有 EmployerConfirmedFeedback 可以称为"招聘方反馈"，
 * JobAgentInference 必须显示为"招聘方 Agent 推断"。
 */
export const SourceLabel = z.enum([
  "CandidateFact",
  "CandidateClaim",
  "InterviewAnswer",
  "JobRequirement",
  "JobAgentInference",
  "EmployerConfirmedFeedback",
  "PlatformInference",
  "ZhihuOfficialResource",
  "ZhihuCachedResource",
  "ZhihuDemoCache",
]);
export type SourceLabel = z.infer<typeof SourceLabel>;

export const SOURCE_LABEL_TEXT: Record<SourceLabel, string> = {
  CandidateFact: "求职者已确认事实",
  CandidateClaim: "求职者自述（未验证）",
  InterviewAnswer: "模拟面试回答",
  JobRequirement: "岗位要求",
  JobAgentInference: "招聘方 Agent 推断",
  EmployerConfirmedFeedback: "招聘方反馈（真人确认）",
  PlatformInference: "平台推断",
  ZhihuOfficialResource: "知乎官方能力实时返回",
  ZhihuCachedResource: "知乎官方能力服务端缓存",
  ZhihuDemoCache: "知乎演示缓存数据",
};

/** 能力项类型 */
export const CriterionType = z.enum([
  "hard_requirement",
  "core_competency",
  "trainable",
  "bonus",
]);
export type CriterionType = z.infer<typeof CriterionType>;

export const CRITERION_TYPE_TEXT: Record<CriterionType, string> = {
  hard_requirement: "硬性条件",
  core_competency: "核心能力",
  trainable: "可培养能力",
  bonus: "加分项",
};

/** 证据等级。L0 表示完全没有证据，绝不能推断为"不具备能力"。 */
export const EvidenceLevel = z.enum(["L0", "L1", "L2", "L3"]);
export type EvidenceLevel = z.infer<typeof EvidenceLevel>;

export const EVIDENCE_LEVEL_TEXT: Record<EvidenceLevel, string> = {
  L0: "L0 无证据",
  L1: "L1 自述无细节",
  L2: "L2 自述含过程与细节",
  L3: "L3 可验证产出或链接",
};

export const EVIDENCE_RELIABILITY: Record<EvidenceLevel, number> = {
  L0: 0,
  L1: 0.45,
  L2: 0.75,
  L3: 1.0,
};

/** Agent 建议。与真人决策分开存储，枚举也刻意不同。 */
export const AgentSuggestion = z.enum([
  "recommend_interview",
  "not_recommended_yet",
  "human_review_required",
]);
export type AgentSuggestion = z.infer<typeof AgentSuggestion>;

export const AGENT_SUGGESTION_TEXT: Record<AgentSuggestion, string> = {
  recommend_interview: "建议邀约",
  not_recommended_yet: "暂不邀约",
  human_review_required: "建议人工复核",
};

/** 真人决策 */
export const HumanDecision = z.enum([
  "interview_invited",
  "not_invited",
  "human_review",
]);
export type HumanDecision = z.infer<typeof HumanDecision>;

export const HUMAN_DECISION_TEXT: Record<HumanDecision, string> = {
  interview_invited: "已发出面试邀约",
  not_invited: "暂不邀约",
  human_review: "转人工复核",
};

/** 申请生命周期状态，仅由确定性状态机修改 */
export const ApplicationState = z.enum([
  "draft",
  "authorized",
  "dispatched",
  "in_dialogue",
  "assessed",
  "human_confirmed",
  "withdrawn",
  "failed",
]);
export type ApplicationState = z.infer<typeof ApplicationState>;

export const APPLICATION_STATE_TEXT: Record<ApplicationState, string> = {
  draft: "草稿",
  authorized: "已授权",
  dispatched: "已发送",
  in_dialogue: "Agent 沟通中",
  assessed: "已产出评估",
  human_confirmed: "真人已确认",
  withdrawn: "已撤回",
  failed: "失败",
};

/** A2A 消息类型 */
export const A2AMessageType = z.enum([
  "application_submit",
  "clarification_request",
  "clarification_response",
  "assessment_result",
  "withdrawal_notice",
  "system_note",
]);
export type A2AMessageType = z.infer<typeof A2AMessageType>;

export const A2A_MESSAGE_TYPE_TEXT: Record<A2AMessageType, string> = {
  application_submit: "投递申请",
  clarification_request: "招聘方 Agent 追问",
  clarification_response: "求职者 Agent 回答",
  assessment_result: "评估结果",
  withdrawal_notice: "撤回通知",
  system_note: "系统说明",
};

/** Provider 运行模式 */
export const ProviderMode = z.enum(["live", "mock", "fallback"]);
export type ProviderMode = z.infer<typeof ProviderMode>;

/** 知乎数据状态 */
export const ZhihuDataStatus = z.enum([
  "live",
  "server_cache",
  "demo_cache",
  "offline_fallback",
]);
export type ZhihuDataStatus = z.infer<typeof ZhihuDataStatus>;

export const ZHIHU_DATA_STATUS_TEXT: Record<ZhihuDataStatus, string> = {
  live: "Live 实时调用",
  server_cache: "Server Cache 服务端缓存",
  demo_cache: "Demo Cache 演示缓存",
  offline_fallback: "Offline Fallback 离线兜底",
};

/** 成长报告反馈分类 */
export const FeedbackCategory = z.enum([
  "repeated_signal",
  "job_specific",
  "evidence_problem",
  "conflicting",
]);
export type FeedbackCategory = z.infer<typeof FeedbackCategory>;

export const FEEDBACK_CATEGORY_TEXT: Record<FeedbackCategory, string> = {
  repeated_signal: "跨岗位重复信号",
  job_specific: "岗位特有要求",
  evidence_problem: "材料证据问题",
  conflicting: "冲突反馈",
};
