import { TaskState, type Message, type Task } from "@a2a-js/sdk";
import type { AgentExecutor } from "@a2a-js/sdk/server";
import { serverConfig } from "@/lib/config";
import { MAX_CLARIFICATION_ROUNDS } from "@/lib/engine/state-machine";
import { makeId, nowIso, sanitizeUntrusted } from "@/lib/engine/util";
import type {
  A2AEnvelope,
  CandidateAgent,
  CandidateProfile,
  Evidence,
  JobVersion,
} from "@/lib/schema/domain";
import { jobAgentCard } from "./agent-cards";
import type { ApplicationPayload } from "./job-executor";
import { JobAgentExecutor, type JobExecutorHooks } from "./job-executor";
import {
  buildMessage,
  readDataPart,
  readTextParts,
  stateName,
} from "./protocol";
import { createInProcessTransport, isTask, type A2ATransport } from "./transport";

/**
 * 求职者 Agent 侧的客户端。
 *
 * 边界约束：
 * - 只能发送披露范围内的证据；追问的回答同样只从同一个证据池里取，
 *   范围外一律回复「无法提供」，不会自行扩大披露。
 * - 不发送原始简历全文、原始音频、未确认的转写或任何敏感属性。
 */

export type DispatchHooks = JobExecutorHooks & {
  onCandidateMessage?: (input: {
    taskId: string;
    envelope: A2AEnvelope;
    role: "user";
    text: string;
    data: unknown;
  }) => void;
};

export type DispatchResult = {
  jobVersionId: string;
  taskId: string;
  contextId: string;
  finalState: string;
  clarificationRounds: number;
  transport: string;
};

function buildApplicationPayload(input: {
  applicationId: string;
  agent: CandidateAgent;
  profile: CandidateProfile;
  job: JobVersion;
  evidencePool: Evidence[];
}): ApplicationPayload {
  const d = input.agent.disclosure;
  const allowedPortfolio = new Set(d.portfolio_item_ids);
  return {
    application_id: input.applicationId,
    candidate_agent_id: input.agent.candidate_agent_id,
    job_version_id: input.job.job_version_id,
    material_version: input.agent.material_version,
    display_name: d.share_display_name ? input.profile.display_name : null,
    target_role: d.share_target_role ? input.profile.target_role : null,
    evidence: input.evidencePool.map((e) => ({
      ...e,
      claim: sanitizeUntrusted(e.claim, 400),
      quote: sanitizeUntrusted(e.quote, 1200),
    })),
    portfolio: input.profile.portfolio
      .filter((p) => p.confirmed && allowedPortfolio.has(p.item_id))
      .map((p) => ({
        title: p.title,
        url: p.url,
        note: sanitizeUntrusted(p.note, 600),
      })),
  };
}

/**
 * 在授权证据池里为追问找可引用的证据。
 * 找不到就明确回答「授权范围内没有可核验材料」，而不是编造或扩大披露。
 */
function answerClarification(input: {
  question: string;
  criterionId: string;
  job: JobVersion;
  evidencePool: Evidence[];
}): { text: string; evidenceIds: string[] } {
  const criterion = input.job.criteria.find(
    (c) => c.criterion_id === input.criterionId,
  );
  const keywords = criterion
    ? [criterion.name, ...criterion.name.split(/[\s/、]/)].filter(
        (k) => k.trim().length > 1,
      )
    : [];
  const matched = input.evidencePool.filter((e) =>
    keywords.some(
      (k) => e.claim.includes(k) || e.quote.includes(k) || e.material_ref.includes(k),
    ),
  );

  if (matched.length === 0) {
    return {
      text: [
        `关于「${criterion?.name ?? input.criterionId}」，求职者已授权的材料中没有可核验的对应内容。`,
        "按用户设定的披露范围，我不会补充范围外的信息，也不会代替求职者做出未经确认的陈述。",
        "请按「信息不足」处理，不要据此判断求职者不具备该能力。",
      ].join("\n"),
      evidenceIds: [],
    };
  }

  const cited = matched.slice(0, 3);
  return {
    text: [
      `关于「${criterion?.name ?? input.criterionId}」，在已授权范围内可引用以下已确认材料：`,
      ...cited.map((e, i) => `${i + 1}. ${e.claim}（来源：${e.material_ref}，证据等级 ${e.level}）`),
      "以上均为求职者本人确认过的内容，未包含授权范围外的信息。",
    ].join("\n"),
    evidenceIds: cited.map((e) => e.evidence_id),
  };
}

/**
 * 驱动单个岗位的完整 A2A 会话：
 * submit -> WORKING -> （可能 INPUT_REQUIRED 追问 -> 回答）-> Artifact -> COMPLETED。
 */
export async function runJobConversation(input: {
  applicationId: string;
  job: JobVersion;
  agent: CandidateAgent;
  profile: CandidateProfile;
  evidencePool: Evidence[];
  baseUrl: string;
  hooks?: DispatchHooks;
  executorFactory?: (job: JobVersion, hooks: JobExecutorHooks) => AgentExecutor;
  transportFactory?: (input: {
    job: JobVersion;
    executor: AgentExecutor;
    baseUrl: string;
  }) => A2ATransport;
}): Promise<DispatchResult> {
  const hooks = input.hooks ?? {};
  const executor = input.executorFactory
    ? input.executorFactory(input.job, hooks)
    : new JobAgentExecutor(input.job, hooks);
  const transport = input.transportFactory
    ? input.transportFactory({ job: input.job, executor, baseUrl: input.baseUrl })
    : createInProcessTransport({
        agentCard: jobAgentCard(input.job, input.baseUrl),
        executor,
      });

  // A2A 规范下首条消息不携带 taskId，由服务端创建任务并分配 id；
  // 客户端只先生成 contextId 以关联同一次会话。
  const contextId = makeId("ctx");
  const correlationId = makeId("submit");
  const payload = buildApplicationPayload({
    applicationId: input.applicationId,
    agent: input.agent,
    profile: input.profile,
    job: input.job,
    evidencePool: input.evidencePool,
  });

  const submitEnvelope: A2AEnvelope = {
    // 首条消息发出时任务尚未创建，先用本地关联 id 占位，
    // 落库时由编排层统一改写为服务端分配的真实 task_id。
    task_id: correlationId,
    message_id: makeId("msg"),
    sender: `candidate_agent:${input.agent.candidate_agent_id}`,
    receiver: `job_agent:${input.job.job_version_id}`,
    job_version_id: input.job.job_version_id,
    material_version: input.agent.material_version,
    timestamp: nowIso(),
    message_type: "application_submit",
    evidence_ids: payload.evidence.map((e) => e.evidence_id),
  };
  const submitText = [
    `求职者 Agent 代表${payload.display_name ?? "（姓名未披露）"}投递岗位「${input.job.title}」。`,
    `目标方向：${payload.target_role ?? "（未披露）"}。`,
    `本次共享 ${payload.evidence.length} 条已确认证据、${payload.portfolio.length} 个作品链接，均在用户一次性授权的披露范围内。`,
    "未包含简历全文、原始音频与任何敏感属性。",
  ].join("\n");

  const submitMessage = buildMessage({
    envelope: submitEnvelope,
    role: "user",
    text: submitText,
    data: payload,
  });
  submitMessage.contextId = contextId;
  submitMessage.taskId = "";

  hooks.onCandidateMessage?.({
    taskId: correlationId,
    envelope: submitEnvelope,
    role: "user",
    text: submitText,
    data: payload,
  });

  let result = await transport.sendMessage({
    tenant: "",
    message: submitMessage,
    configuration: {
      acceptedOutputModes: ["text/plain", "application/json"],
      taskPushNotificationConfig: undefined,
      returnImmediately: false,
    },
    metadata: undefined,
  });

  if (!isTask(result)) {
    throw new Error("招聘方 Agent 未创建 A2A 任务，无法继续会话");
  }
  const taskId = result.id;

  let rounds = 0;
  while (isTask(result) && result.status?.state === TaskState.TASK_STATE_INPUT_REQUIRED) {
    if (rounds >= MAX_CLARIFICATION_ROUNDS) break;
    rounds += 1;
    const task = result as Task;
    const ask = task.status?.message;
    if (!ask) break;
    const askData = readDataPart<{ question_id: string; criterion_id: string }>(
      ask.parts,
    );
    const answer = answerClarification({
      question: sanitizeUntrusted(readTextParts(ask.parts), 1000),
      criterionId: askData?.criterion_id ?? "",
      job: input.job,
      evidencePool: input.evidencePool,
    });

    const envelope: A2AEnvelope = {
      task_id: taskId,
      message_id: makeId("msg"),
      sender: `candidate_agent:${input.agent.candidate_agent_id}`,
      receiver: `job_agent:${input.job.job_version_id}`,
      job_version_id: input.job.job_version_id,
      material_version: input.agent.material_version,
      timestamp: nowIso(),
      message_type: "clarification_response",
      evidence_ids: answer.evidenceIds,
    };
    const data = {
      question_id: askData?.question_id ?? "",
      answer_evidence_ids: answer.evidenceIds,
    };
    const replyMessage = buildMessage({
      envelope,
      role: "user",
      text: answer.text,
      data,
    });
    replyMessage.contextId = task.contextId;

    hooks.onCandidateMessage?.({
      taskId,
      envelope,
      role: "user",
      text: answer.text,
      data,
    });

    result = await transport.sendMessage({
      tenant: "",
      message: { ...replyMessage, taskId, contextId: task.contextId },
      configuration: {
        acceptedOutputModes: ["text/plain", "application/json"],
        taskPushNotificationConfig: undefined,
        returnImmediately: false,
      },
      metadata: undefined,
    });
  }

  const finalTask = isTask(result) ? result : await transport.getTask(taskId);
  return {
    jobVersionId: input.job.job_version_id,
    taskId,
    contextId: finalTask.contextId || contextId,
    finalState: finalTask.status
      ? stateName(finalTask.status.state)
      : stateName(TaskState.TASK_STATE_UNSPECIFIED),
    clarificationRounds: rounds,
    transport: transport.name || serverConfig.a2a.transport,
  };
}

export type { Message, Task };
