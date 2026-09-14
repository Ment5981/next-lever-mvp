import { z } from "zod";
import {
  A2AMessageType,
  AgentSuggestion,
  ApplicationState,
  CriterionType,
  EvidenceLevel,
  FeedbackCategory,
  HumanDecision,
  SourceLabel,
  ZhihuDataStatus,
} from "./enums";

const Id = z.string().min(1);
const Timestamp = z.string().min(1);

/** 岗位能力项。权重合计必须为 100。 */
export const CompetencyCriterion = z.object({
  criterion_id: Id,
  name: z.string().min(1).max(60),
  type: CriterionType,
  description: z.string().min(1).max(600),
  weight: z.number().min(0).max(100),
  must_have: z.boolean(),
  evidence_standard: z.string().min(1).max(600),
  evaluation_questions: z.array(z.string().min(1).max(300)).min(1).max(5),
  source: SourceLabel.default("JobRequirement"),
});
export type CompetencyCriterion = z.infer<typeof CompetencyCriterion>;

/** 招聘方追问 */
export const ClarifyingQuestion = z.object({
  question_id: Id,
  question: z.string().min(1).max(300),
  why_it_matters: z.string().min(1).max(300),
  answer: z.string().max(2000).nullable().default(null),
});
export type ClarifyingQuestion = z.infer<typeof ClarifyingQuestion>;

/** 岗位版本。确认后不可静默覆盖，只能追加新版本。 */
export const JobVersion = z.object({
  job_version_id: Id,
  job_id: Id,
  version: z.number().int().positive(),
  company_name: z.string().min(1).max(80),
  title: z.string().min(1).max(80),
  raw_input: z.string().max(8000),
  input_mode: z.enum(["text", "voice"]),
  transcript_confirmed: z.boolean(),
  summary: z.string().min(1).max(1200),
  criteria: z.array(CompetencyCriterion).min(1).max(12),
  clarifications: z.array(ClarifyingQuestion).max(5).default([]),
  confirmed: z.boolean().default(false),
  confirmed_at: Timestamp.nullable().default(null),
  created_at: Timestamp,
});
export type JobVersion = z.infer<typeof JobVersion>;

/** LLM 岗位结构化输出（不含平台生成的 id / 时间戳） */
export const JobStructureDraft = z.object({
  title: z.string().min(1).max(80),
  summary: z.string().min(1).max(1200),
  clarifying_questions: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        why_it_matters: z.string().min(1).max(300),
      }),
    )
    .min(3)
    .max(5),
  criteria: z
    .array(CompetencyCriterion.omit({ criterion_id: true, source: true }))
    .min(3)
    .max(10),
});
export type JobStructureDraft = z.infer<typeof JobStructureDraft>;

/** 求职者材料中提取的事实，必须保留原文证据片段 */
export const Evidence = z.object({
  evidence_id: Id,
  claim: z.string().min(1).max(400),
  quote: z.string().min(1).max(1200),
  material_ref: z.string().min(1).max(200),
  level: EvidenceLevel,
  source: SourceLabel,
  confirmed: z.boolean().default(false),
  edited_by_user: z.boolean().default(false),
});
export type Evidence = z.infer<typeof Evidence>;

export const EvidenceDraft = z.object({
  facts: z
    .array(
      z.object({
        claim: z.string().min(1).max(400),
        quote: z.string().min(1).max(1200),
        material_ref: z.string().min(1).max(200),
        level: EvidenceLevel,
      }),
    )
    .min(1)
    .max(20),
});
export type EvidenceDraft = z.infer<typeof EvidenceDraft>;

export const PortfolioItem = z.object({
  item_id: Id,
  title: z.string().min(1).max(120),
  url: z.string().max(500),
  note: z.string().max(600).default(""),
  confirmed: z.boolean().default(false),
});
export type PortfolioItem = z.infer<typeof PortfolioItem>;

/** 模拟面试问答 */
export const InterviewTurn = z.object({
  turn_id: Id,
  question: z.string().min(1).max(400),
  linked_criterion_id: Id.nullable().default(null),
  answer_mode: z.enum(["text", "voice"]).default("text"),
  raw_answer: z.string().max(4000).default(""),
  transcript_confirmed: z.boolean().default(false),
  answer_summary: z.string().max(800).default(""),
  summary_confirmed: z.boolean().default(false),
});
export type InterviewTurn = z.infer<typeof InterviewTurn>;

export const InterviewSession = z.object({
  session_id: Id,
  candidate_id: Id,
  target_job_version_id: Id.nullable().default(null),
  turns: z.array(InterviewTurn).max(5).default([]),
  completed: z.boolean().default(false),
});
export type InterviewSession = z.infer<typeof InterviewSession>;

export const InterviewQuestionDraft = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1).max(400),
        linked_criterion_name: z.string().max(60).default(""),
      }),
    )
    .min(3)
    .max(5),
});
export type InterviewQuestionDraft = z.infer<typeof InterviewQuestionDraft>;

/** 求职者档案 */
export const CandidateProfile = z.object({
  candidate_id: Id,
  display_name: z.string().min(1).max(40),
  target_role: z.string().min(1).max(80),
  resume_text: z.string().max(20000).default(""),
  project_text: z.string().max(20000).default(""),
  portfolio: z.array(PortfolioItem).max(20).default([]),
  evidence: z.array(Evidence).max(40).default([]),
  materials_confirmed: z.boolean().default(false),
  updated_at: Timestamp,
});
export type CandidateProfile = z.infer<typeof CandidateProfile>;

/** 披露范围。字段级，由用户逐项确认。 */
export const DisclosureScope = z.object({
  share_display_name: z.boolean().default(true),
  share_target_role: z.boolean().default(true),
  evidence_ids: z.array(Id).default([]),
  portfolio_item_ids: z.array(Id).default([]),
  interview_turn_ids: z.array(Id).default([]),
});
export type DisclosureScope = z.infer<typeof DisclosureScope>;

/** 可投递的求职者 Agent。只有确认材料+面试+披露范围后才能生成。 */
export const CandidateAgent = z.object({
  candidate_agent_id: Id,
  candidate_id: Id,
  material_version: z.number().int().positive(),
  disclosure: DisclosureScope,
  disclosure_confirmed: z.boolean().default(false),
  agent_card_name: z.string().min(1),
  created_at: Timestamp,
});
export type CandidateAgent = z.infer<typeof CandidateAgent>;

/** 一次性批量授权记录 */
export const AuthorizationRecord = z.object({
  authorization_id: Id,
  candidate_agent_id: Id,
  job_version_ids: z.array(Id).min(1),
  job_count: z.number().int().positive(),
  disclosure_snapshot: DisclosureScope,
  authorized_at: Timestamp,
});
export type AuthorizationRecord = z.infer<typeof AuthorizationRecord>;

/** A2A 消息信封 */
export const A2AEnvelope = z.object({
  task_id: Id,
  message_id: Id,
  sender: z.string().min(1),
  receiver: z.string().min(1),
  job_version_id: Id,
  material_version: z.number().int().positive(),
  timestamp: Timestamp,
  message_type: A2AMessageType,
  evidence_ids: z.array(Id).default([]),
});
export type A2AEnvelope = z.infer<typeof A2AEnvelope>;

export const A2AMessageRecord = z.object({
  envelope: A2AEnvelope,
  role: z.enum(["user", "agent"]),
  text: z.string().max(4000),
  data: z.unknown().nullable().default(null),
});
export type A2AMessageRecord = z.infer<typeof A2AMessageRecord>;

export const A2AArtifactRecord = z.object({
  artifact_id: Id,
  task_id: Id,
  name: z.string().min(1),
  description: z.string().default(""),
  created_at: Timestamp,
  payload: z.unknown(),
});
export type A2AArtifactRecord = z.infer<typeof A2AArtifactRecord>;

export const A2AStateEvent = z.object({
  at: Timestamp,
  state: z.string().min(1),
  note: z.string().default(""),
});
export type A2AStateEvent = z.infer<typeof A2AStateEvent>;

export const A2ATaskRecord = z.object({
  task_id: Id,
  context_id: Id,
  application_id: Id,
  job_version_id: Id,
  candidate_agent_id: Id,
  state: z.string().min(1),
  state_history: z.array(A2AStateEvent).default([]),
  messages: z.array(A2AMessageRecord).default([]),
  artifacts: z.array(A2AArtifactRecord).default([]),
  clarification_rounds: z.number().int().min(0).max(2).default(0),
  transport: z.string().min(1),
  protocol_version: z.string().min(1),
});
export type A2ATaskRecord = z.infer<typeof A2ATaskRecord>;

/** 单项能力评估 */
export const CriterionAssessment = z.object({
  criterion_id: Id,
  criterion_name: z.string().min(1),
  weight: z.number().min(0).max(100),
  must_have: z.boolean(),
  fit_score: z.number().min(0).max(100),
  evidence_level: EvidenceLevel,
  completeness: z.number().min(0).max(100),
  criterion_score: z.number().min(0).max(1),
  evidence_ids: z.array(Id).default([]),
  finding: z.string().min(1).max(600),
  gap_type: z.enum(["none", "evidence_missing", "capability_gap", "unknown"]),
  source: SourceLabel.default("JobAgentInference"),
});
export type CriterionAssessment = z.infer<typeof CriterionAssessment>;

export const HardRequirementCheck = z.object({
  criterion_id: Id,
  criterion_name: z.string().min(1),
  status: z.enum(["met", "not_met", "insufficient_evidence"]),
  note: z.string().max(600).default(""),
});
export type HardRequirementCheck = z.infer<typeof HardRequirementCheck>;

/** 招聘方 Agent 的评估结果（Artifact 主体） */
export const JobAssessment = z.object({
  assessment_id: Id,
  task_id: Id,
  job_version_id: Id,
  candidate_agent_id: Id,
  soft_match_score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  suggestion: AgentSuggestion,
  suggestion_reason: z.string().min(1).max(1200),
  criterion_assessments: z.array(CriterionAssessment).min(1),
  hard_requirements: z.array(HardRequirementCheck).default([]),
  strengths: z.array(z.string().min(1).max(400)).default([]),
  evidence_gaps: z.array(z.string().min(1).max(400)).default([]),
  next_actions: z.array(z.string().min(1).max(400)).default([]),
  info_insufficient: z.boolean().default(false),
  source: SourceLabel.default("JobAgentInference"),
  created_at: Timestamp,
});
export type JobAssessment = z.infer<typeof JobAssessment>;

/** 真人决策，独立存储 */
export const EmployerDecision = z.object({
  decision_id: Id,
  task_id: Id,
  job_version_id: Id,
  decision: HumanDecision,
  reason: z.string().min(1).max(1200),
  overrode_agent: z.boolean().default(false),
  override_reason: z.string().max(1200).default(""),
  decided_by: z.string().min(1),
  decided_at: Timestamp,
  source: SourceLabel.default("EmployerConfirmedFeedback"),
});
export type EmployerDecision = z.infer<typeof EmployerDecision>;

export const Application = z.object({
  application_id: Id,
  batch_id: Id,
  candidate_agent_id: Id,
  job_version_id: Id,
  state: ApplicationState,
  task_id: Id.nullable().default(null),
  created_at: Timestamp,
  updated_at: Timestamp,
});
export type Application = z.infer<typeof Application>;

export const ApplicationBatch = z.object({
  batch_id: Id,
  authorization_id: Id,
  candidate_agent_id: Id,
  application_ids: z.array(Id).min(1),
  created_at: Timestamp,
});
export type ApplicationBatch = z.infer<typeof ApplicationBatch>;

/** 知乎资源卡片。只展示真实返回的字段，缺失字段标记为"未返回"。 */
export const ZhihuResource = z.object({
  resource_id: Id,
  title: z.string().min(1),
  excerpt: z.string().nullable(),
  author_name: z.string().nullable(),
  url: z.string().nullable(),
  content_type: z.string().nullable(),
  authority_signal: z.string().nullable(),
  relevance_signal: z.string().nullable(),
  fetched_at: Timestamp,
  data_status: ZhihuDataStatus,
  api_name: z.string().min(1),
  why_for_task: z.string().min(1).max(600),
  source: SourceLabel,
});
export type ZhihuResource = z.infer<typeof ZhihuResource>;

export const ZhihuFetchMeta = z.object({
  data_status: ZhihuDataStatus,
  api_name: z.string(),
  fetched_at: Timestamp,
  cache_key: z.string(),
  calls_today: z.number().int().min(0),
  daily_budget: z.number().int().min(0),
  breaker_open: z.boolean(),
  note: z.string().default(""),
});
export type ZhihuFetchMeta = z.infer<typeof ZhihuFetchMeta>;

/** 成长任务 */
export const GrowthTask = z.object({
  task_id: Id,
  target_capability: z.string().min(1).max(120),
  reason: z.string().min(1).max(800),
  related_job_version_ids: z.array(Id).min(1),
  source_feedback: z
    .array(
      z.object({
        job_version_id: Id,
        quote: z.string().min(1).max(600),
        source: SourceLabel,
      }),
    )
    .min(1),
  learning_content: z.array(z.string().min(1).max(400)).min(1),
  practice_task: z.string().min(1).max(800),
  recommend_competition_or_oss: z.boolean(),
  competition_or_oss_note: z.string().max(600).default(""),
  estimated_effort: z.string().min(1).max(120),
  deliverable: z.string().min(1).max(600),
  acceptance_criteria: z.array(z.string().min(1).max(400)).min(1),
  re_evaluation: z.string().min(1).max(600),
  zhihu_resources: z.array(ZhihuResource).default([]),
  zhihu_meta: ZhihuFetchMeta.nullable().default(null),
});
export type GrowthTask = z.infer<typeof GrowthTask>;

export const FeedbackSignal = z.object({
  signal_id: Id,
  category: FeedbackCategory,
  statement: z.string().min(1).max(600),
  job_version_ids: z.array(Id).min(1),
  citations: z
    .array(
      z.object({
        job_version_id: Id,
        quote: z.string().min(1).max(600),
        source: SourceLabel,
      }),
    )
    .min(1),
});
export type FeedbackSignal = z.infer<typeof FeedbackSignal>;

export const GrowthReport = z.object({
  report_id: Id,
  candidate_agent_id: Id,
  sample_size: z.number().int().min(0),
  human_confirmed_count: z.number().int().min(0),
  agent_inferred_count: z.number().int().min(0),
  info_insufficient_count: z.number().int().min(0),
  feedback_sources: z.array(z.string().min(1)).default([]),
  overall_confidence: z.number().min(0).max(1),
  confidence_note: z.string().min(1).max(600),
  funnel: z.object({
    authorized: z.number().int().min(0),
    dispatched: z.number().int().min(0),
    assessed: z.number().int().min(0),
    human_confirmed: z.number().int().min(0),
    invited: z.number().int().min(0),
  }),
  signals: z.array(FeedbackSignal).default([]),
  growth_tasks: z.array(GrowthTask).min(1).max(3),
  created_at: Timestamp,
});
export type GrowthReport = z.infer<typeof GrowthReport>;
