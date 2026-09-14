import { serverConfig } from "@/lib/config";
import { PROTOCOL_VERSION } from "@/lib/a2a/protocol";
import { defaultDisclosure } from "@/lib/demo/scenario";
import { PRESET_CANDIDATE, PRESET_INTERVIEW } from "@/lib/demo/preset-candidate";
import { PRESET_JOB_VERSIONS } from "@/lib/demo/preset-jobs";
import { canAuthorize, canDispatch, canPublishCandidateAgent } from "@/lib/engine/gates";
import { transition } from "@/lib/engine/state-machine";
import { makeId, nowIso } from "@/lib/engine/util";
import { resetZhihuProvider } from "@/lib/providers/zhihu";
import type {
  A2AArtifactRecord,
  A2AMessageRecord,
  A2AStateEvent,
  A2ATaskRecord,
  Application,
  ApplicationBatch,
  AuthorizationRecord,
  CandidateAgent,
  CandidateAgentSettings,
  CandidateMarketplacePost,
  CandidateProfile,
  DisclosureScope,
  EmployerDecision,
  GrowthReport,
  InterviewSession,
  JobAssessment,
  JobVersion,
} from "@/lib/schema/domain";
import type { ApplicationState } from "@/lib/schema/enums";

/**
 * 服务端内存状态。MVP 用模块级单例，进程重启即回到预置 Demo 状态。
 * 所有关键状态变更都必须经过本文件的显式方法 + 状态机，
 * 不允许 LLM 输出或 A2A 自由文本直接改写状态。
 */
export type StoreState = {
  jobs: JobVersion[];
  candidateMarketplacePosts: CandidateMarketplacePost[];
  candidate: CandidateProfile;
  interview: InterviewSession;
  disclosure: DisclosureScope;
  disclosureConfirmed: boolean;
  candidateAgent: CandidateAgent | null;
  authorizations: AuthorizationRecord[];
  batches: ApplicationBatch[];
  applications: Application[];
  tasks: A2ATaskRecord[];
  assessments: JobAssessment[];
  decisions: EmployerDecision[];
  reports: GrowthReport[];
  materialVersion: number;
  auditLog: { at: string; action: string; detail: string }[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function initialState(): StoreState {
  return {
    jobs: clone(PRESET_JOB_VERSIONS),
    candidateMarketplacePosts: [],
    candidate: clone(PRESET_CANDIDATE),
    interview: clone(PRESET_INTERVIEW),
    disclosure: defaultDisclosure(),
    disclosureConfirmed: false,
    candidateAgent: null,
    authorizations: [],
    batches: [],
    applications: [],
    tasks: [],
    assessments: [],
    decisions: [],
    reports: [],
    materialVersion: 1,
    auditLog: [],
  };
}

const globalKey = "__next_lever_store__";
type GlobalWithStore = typeof globalThis & { [globalKey]?: StoreState };

function stateRef(): StoreState {
  const g = globalThis as GlobalWithStore;
  if (!g[globalKey]) g[globalKey] = initialState();
  return g[globalKey];
}

export function getState(): StoreState {
  return stateRef();
}

function audit(action: string, detail: string): void {
  stateRef().auditLog.push({ at: nowIso(), action, detail });
}

/** Reset 按钮：回到预置 Demo 状态，并清空知乎缓存与计数。 */
export function resetStore(): void {
  const g = globalThis as GlobalWithStore;
  g[globalKey] = initialState();
  resetZhihuProvider();
  audit("reset", "已重置为预置演示状态，知乎缓存与调用计数同时清空");
}

/* --------------------------------- 岗位 --------------------------------- */

export function listJobs(): JobVersion[] {
  return stateRef().jobs;
}

export function findJob(jobVersionId: string): JobVersion | null {
  return stateRef().jobs.find((j) => j.job_version_id === jobVersionId) ?? null;
}

/**
 * 追加岗位版本。已确认版本不可静默覆盖：
 * 同一 job_id 再次确认只会生成 version+1 的新记录。
 */
export function appendJobVersion(job: JobVersion): JobVersion {
  const state = stateRef();
  const existing = state.jobs.filter((j) => j.job_id === job.job_id);
  const version = existing.length === 0 ? 1 : Math.max(...existing.map((j) => j.version)) + 1;
  const stored: JobVersion = {
    ...job,
    version,
    job_version_id: `${job.job_id}_v${version}`,
  };
  state.jobs.push(stored);
  audit("job_version_appended", `${stored.job_version_id} 由招聘方确认生成，旧版本保留`);
  return stored;
}

/** 发布或下架岗位 Agent，不改写岗位内容与版本号。 */
export function setJobPublished(jobVersionId: string, published: boolean): JobVersion | null {
  const state = stateRef();
  const index = state.jobs.findIndex((job) => job.job_version_id === jobVersionId);
  if (index < 0) return null;
  state.jobs[index] = { ...state.jobs[index], published };
  audit("job_publication_changed", `${jobVersionId} ${published ? "发布到" : "从"}求职广场`);
  return state.jobs[index];
}

/** 修改岗位招聘状态。已招满只影响新对话入口，不删除历史记录。 */
export function setJobHiringStatus(
  jobVersionId: string,
  hiring_status: "hiring" | "filled",
): JobVersion | null {
  const state = stateRef();
  const index = state.jobs.findIndex((job) => job.job_version_id === jobVersionId);
  if (index < 0) return null;
  state.jobs[index] = { ...state.jobs[index], hiring_status };
  audit("job_hiring_status_changed", `${jobVersionId} 状态改为 ${hiring_status}`);
  return state.jobs[index];
}

/* --------------------------- 求职广场发布 --------------------------- */

export function listCandidateMarketplacePosts(): CandidateMarketplacePost[] {
  return stateRef().candidateMarketplacePosts.filter((post) => post.published);
}

export function publishCandidateMarketplacePost(
  post: CandidateMarketplacePost,
): CandidateMarketplacePost {
  const state = stateRef();
  const existingIndex = state.candidateMarketplacePosts.findIndex(
    (item) => item.candidate_id === post.candidate_id,
  );
  if (existingIndex >= 0) {
    state.candidateMarketplacePosts[existingIndex] = post;
  } else {
    state.candidateMarketplacePosts.push(post);
  }
  audit("candidate_marketplace_post_published", `${post.candidate_id} 发布求职卡 ${post.post_id}`);
  return post;
}

/* ------------------------------- 求职者材料 ------------------------------- */

export function getCandidate(): CandidateProfile {
  return stateRef().candidate;
}

export function updateCandidate(patch: Partial<CandidateProfile>): CandidateProfile {
  const state = stateRef();
  state.candidate = { ...state.candidate, ...patch, updated_at: nowIso() };
  state.materialVersion += 1;
  audit("candidate_updated", `材料版本升至 ${state.materialVersion}`);
  return state.candidate;
}

export function getInterview(): InterviewSession {
  return stateRef().interview;
}

export function updateInterview(session: InterviewSession): InterviewSession {
  stateRef().interview = session;
  audit("interview_updated", `模拟面试更新，completed=${session.completed}`);
  return session;
}

export function getDisclosure(): { scope: DisclosureScope; confirmed: boolean } {
  const state = stateRef();
  return { scope: state.disclosure, confirmed: state.disclosureConfirmed };
}

export function setDisclosure(scope: DisclosureScope, confirmed: boolean): void {
  const state = stateRef();
  state.disclosure = scope;
  state.disclosureConfirmed = confirmed;
  audit(
    "disclosure_set",
    `披露范围：${scope.evidence_ids.length} 条证据 / ${scope.interview_turn_ids.length} 条回答，confirmed=${confirmed}`,
  );
}

/* ------------------------------ 求职者 Agent ------------------------------ */

export function getCandidateAgent(): CandidateAgent | null {
  return stateRef().candidateAgent;
}

/** 生成可投递 Agent。三项确认未完成时返回 blockers，不产生 Agent。 */
export function publishCandidateAgent(): {
  ok: boolean;
  blockers: string[];
  agent: CandidateAgent | null;
} {
  const state = stateRef();
  const gate = canPublishCandidateAgent({
    profile: state.candidate,
    session: state.interview,
    disclosure: state.disclosure,
    disclosureConfirmed: state.disclosureConfirmed,
  });
  if (!gate.ok) return { ok: false, blockers: gate.blockers, agent: null };

  const agent: CandidateAgent = {
    candidate_agent_id: makeId("cagent"),
    candidate_id: state.candidate.candidate_id,
    material_version: state.materialVersion,
    disclosure: clone(state.disclosure),
    disclosure_confirmed: true,
    agent_card_name: `${state.candidate.display_name} · 求职者 Agent`,
    personality: {
      tone: "structured",
      traits: ["基于事实", "具体回答", "谨慎披露"],
    },
    memory_policy: "confirmed_only",
    created_at: nowIso(),
  };
  state.candidateAgent = agent;
  audit("candidate_agent_published", `${agent.candidate_agent_id} 生成，材料版本 ${agent.material_version}`);
  return { ok: true, blockers: [], agent };
}

/** 编辑 Agent 的可变配置；材料与披露内容仍需从对应页面重新确认。 */
export function updateCandidateAgentSettings(
  settings: CandidateAgentSettings,
): CandidateAgent | null {
  const state = stateRef();
  if (!state.candidateAgent) return null;
  state.candidateAgent = {
    ...state.candidateAgent,
    ...settings,
  };
  audit("candidate_agent_settings_updated", `更新 Agent 配置：${settings.agent_card_name}`);
  return state.candidateAgent;
}

/* -------------------------------- 授权 -------------------------------- */

export function listAuthorizations(): AuthorizationRecord[] {
  return stateRef().authorizations;
}

export function latestAuthorization(): AuthorizationRecord | null {
  const list = stateRef().authorizations;
  return list.length === 0 ? null : list[list.length - 1];
}

/**
 * 一次性批量授权。授权时冻结披露范围快照，
 * 之后不能静默新增岗位或扩大披露范围。
 */
export function authorize(jobVersionIds: string[]): {
  ok: boolean;
  blockers: string[];
  authorization: AuthorizationRecord | null;
} {
  const state = stateRef();
  const gate = canAuthorize({
    agent: state.candidateAgent,
    selectedJobVersionIds: jobVersionIds,
  });
  if (!gate.ok || !state.candidateAgent) {
    return { ok: false, blockers: gate.blockers, authorization: null };
  }
  const unknown = jobVersionIds.filter((id) => !findJob(id));
  if (unknown.length > 0) {
    return {
      ok: false,
      blockers: [`岗位不存在：${unknown.join("、")}`],
      authorization: null,
    };
  }
  const record: AuthorizationRecord = {
    authorization_id: makeId("auth"),
    candidate_agent_id: state.candidateAgent.candidate_agent_id,
    job_version_ids: [...jobVersionIds],
    job_count: jobVersionIds.length,
    disclosure_snapshot: clone(state.candidateAgent.disclosure),
    authorized_at: nowIso(),
  };
  state.authorizations.push(record);
  audit("authorized", `用户一次性授权 ${record.job_count} 个岗位：${jobVersionIds.join("、")}`);
  return { ok: true, blockers: [], authorization: record };
}

/* -------------------------------- 申请 -------------------------------- */

export function listApplications(): Application[] {
  return stateRef().applications;
}

export function findApplication(applicationId: string): Application | null {
  return stateRef().applications.find((a) => a.application_id === applicationId) ?? null;
}

/** 依据授权记录创建申请批次。未授权时不创建任何申请。 */
export function createApplications(authorizationId: string): {
  ok: boolean;
  blockers: string[];
  batch: ApplicationBatch | null;
} {
  const state = stateRef();
  const auth = state.authorizations.find((a) => a.authorization_id === authorizationId);
  if (!auth) {
    return { ok: false, blockers: ["未找到授权记录，未授权不得创建申请"], batch: null };
  }
  const at = nowIso();
  const batchId = makeId("batch");
  const applications: Application[] = auth.job_version_ids.map((jobVersionId) => ({
    application_id: makeId("app"),
    batch_id: batchId,
    candidate_agent_id: auth.candidate_agent_id,
    job_version_id: jobVersionId,
    // 授权即进入 authorized 状态，dispatch 由 A2A 编排显式推进。
    state: "authorized" as ApplicationState,
    task_id: null,
    created_at: at,
    updated_at: at,
  }));
  const batch: ApplicationBatch = {
    batch_id: batchId,
    authorization_id: auth.authorization_id,
    candidate_agent_id: auth.candidate_agent_id,
    application_ids: applications.map((a) => a.application_id),
    created_at: at,
  };
  state.applications.push(...applications);
  state.batches.push(batch);
  audit("applications_created", `批次 ${batchId} 创建 ${applications.length} 份申请，全部处于 authorized`);
  return { ok: true, blockers: [], batch };
}

/** 在既有一次性授权范围内重新开启单个岗位对话，不扩大授权范围。 */
export function createConversationApplication(
  authorizationId: string,
  jobVersionId: string,
): { ok: boolean; blockers: string[]; application: Application | null } {
  const state = stateRef();
  const auth = state.authorizations.find((item) => item.authorization_id === authorizationId);
  if (!auth) return { ok: false, blockers: ["未找到授权记录，不能开启 A2A 对话"], application: null };
  if (!auth.job_version_ids.includes(jobVersionId)) {
    return { ok: false, blockers: ["该岗位不在已授权范围内，不能静默新增岗位"], application: null };
  }
  const at = nowIso();
  const application: Application = {
    application_id: makeId("app"),
    batch_id: makeId("chat_batch"),
    candidate_agent_id: auth.candidate_agent_id,
    job_version_id: jobVersionId,
    state: "authorized",
    task_id: null,
    created_at: at,
    updated_at: at,
  };
  state.applications.push(application);
  audit("conversation_application_created", `在已授权岗位 ${jobVersionId} 开启一轮新的 A2A 对话`);
  return { ok: true, blockers: [], application };
}

/** 状态推进只允许经过状态机。 */
export function advanceApplication(
  applicationId: string,
  to: ApplicationState,
): Application {
  const app = findApplication(applicationId);
  if (!app) throw new Error(`申请不存在: ${applicationId}`);
  app.state = transition(app.state, to);
  app.updated_at = nowIso();
  audit("application_state", `${applicationId} -> ${to}`);
  return app;
}

export function assertDispatchable(applicationId: string): {
  ok: boolean;
  blockers: string[];
} {
  const app = findApplication(applicationId);
  if (!app) return { ok: false, blockers: ["申请不存在"] };
  const auth = stateRef().authorizations.find((a) =>
    a.job_version_ids.includes(app.job_version_id),
  );
  return canDispatch({
    application: app,
    authorizedJobVersionIds: auth ? auth.job_version_ids : null,
  });
}

/* ------------------------------- A2A 记录 ------------------------------- */

export function listTasks(): A2ATaskRecord[] {
  return stateRef().tasks;
}

export function findTask(taskId: string): A2ATaskRecord | null {
  return stateRef().tasks.find((t) => t.task_id === taskId) ?? null;
}

export function upsertTask(record: A2ATaskRecord): A2ATaskRecord {
  const state = stateRef();
  const index = state.tasks.findIndex((t) => t.task_id === record.task_id);
  if (index === -1) state.tasks.push(record);
  else state.tasks[index] = record;
  return record;
}

export function createTaskRecord(input: {
  taskId: string;
  contextId: string;
  applicationId: string;
  jobVersionId: string;
  candidateAgentId: string;
  state: string;
}): A2ATaskRecord {
  const record: A2ATaskRecord = {
    task_id: input.taskId,
    context_id: input.contextId,
    application_id: input.applicationId,
    job_version_id: input.jobVersionId,
    candidate_agent_id: input.candidateAgentId,
    state: input.state,
    state_history: [{ at: nowIso(), state: input.state, note: "任务创建" }],
    messages: [],
    artifacts: [],
    clarification_rounds: 0,
    transport: serverConfig.a2a.transport,
    protocol_version: PROTOCOL_VERSION,
  };
  return upsertTask(record);
}

export function recordTaskState(taskId: string, event: A2AStateEvent): void {
  const task = findTask(taskId);
  if (!task) return;
  task.state = event.state;
  task.state_history.push(event);
}

export function recordTaskMessage(taskId: string, message: A2AMessageRecord): void {
  const task = findTask(taskId);
  if (!task) return;
  task.messages.push(message);
  if (message.envelope.message_type === "clarification_request") {
    task.clarification_rounds += 1;
  }
}

export function recordTaskArtifact(taskId: string, artifact: A2AArtifactRecord): void {
  const task = findTask(taskId);
  if (!task) return;
  task.artifacts.push(artifact);
}

/* -------------------------------- 评估 -------------------------------- */

export function listAssessments(): JobAssessment[] {
  return stateRef().assessments;
}

export function saveAssessment(assessment: JobAssessment): JobAssessment {
  const state = stateRef();
  const index = state.assessments.findIndex(
    (a) => a.assessment_id === assessment.assessment_id,
  );
  if (index === -1) state.assessments.push(assessment);
  else state.assessments[index] = assessment;
  audit(
    "assessment_saved",
    `${assessment.job_version_id} 匹配度 ${assessment.soft_match_score}，Agent 建议 ${assessment.suggestion}`,
  );
  return assessment;
}

export function assessmentByTask(taskId: string): JobAssessment | null {
  return stateRef().assessments.find((a) => a.task_id === taskId) ?? null;
}

/* ------------------------------ 真人决策 ------------------------------ */

export function listDecisions(): EmployerDecision[] {
  return stateRef().decisions;
}

export function decisionByTask(taskId: string): EmployerDecision | null {
  return stateRef().decisions.find((d) => d.task_id === taskId) ?? null;
}

/** 真人决策与 Agent 建议分开存储，覆盖时必须写明覆盖理由。 */
export function saveDecision(decision: EmployerDecision): EmployerDecision {
  const state = stateRef();
  const index = state.decisions.findIndex((d) => d.task_id === decision.task_id);
  if (index === -1) state.decisions.push(decision);
  else state.decisions[index] = decision;
  audit(
    "employer_decision",
    `${decision.job_version_id} 真人决策 ${decision.decision}，覆盖 Agent 建议=${decision.overrode_agent}`,
  );
  return decision;
}

/* -------------------------------- 报告 -------------------------------- */

export function listReports(): GrowthReport[] {
  return stateRef().reports;
}

export function latestReport(): GrowthReport | null {
  const list = stateRef().reports;
  return list.length === 0 ? null : list[list.length - 1];
}

export function saveReport(report: GrowthReport): GrowthReport {
  stateRef().reports.push(report);
  audit(
    "report_saved",
    `成长报告 ${report.report_id}，样本 ${report.sample_size}，任务 ${report.growth_tasks.length} 项`,
  );
  return report;
}

export function auditLog(): { at: string; action: string; detail: string }[] {
  return stateRef().auditLog;
}
