import { demoEvidencePool } from "@/lib/demo/scenario";
import { nowIso } from "@/lib/engine/util";
import {
  advanceApplication,
  assertDispatchable,
  createTaskRecord,
  findApplication,
  findJob,
  findTask,
  getCandidate,
  getCandidateAgent,
  latestAuthorization,
  listApplications,
  recordTaskArtifact,
  recordTaskMessage,
  recordTaskState,
  saveAssessment,
} from "@/lib/store/store";
import type {
  A2AEnvelope,
  A2AMessageRecord,
  Evidence,
  JobAssessment,
} from "@/lib/schema/domain";
import { runJobConversation, type DispatchResult } from "./candidate-client";

/**
 * A2A 编排层：连接授权后的申请、招聘方 Agent 会话与服务端状态。
 *
 * 三条硬约束：
 * - 未授权（或岗位不在授权范围内）不发送任何消息，assertDispatchable 先把关。
 * - 申请状态只经由状态机推进：authorized -> dispatched -> in_dialogue -> assessed。
 * - Agent 消息只写入 A2ATaskRecord，不能直接改写申请状态或评估结论。
 */

export type DispatchOutcome = {
  ok: boolean;
  blockers: string[];
  results: DispatchResult[];
  assessments: JobAssessment[];
};

let activeDispatch: Promise<DispatchOutcome> | null = null;

export function isA2ADispatchRunning(): boolean {
  return activeDispatch !== null;
}

/** 启动后台 A2A 编排，让前端可以通过快照观察消息和状态逐步落库。 */
export function beginA2ADispatch(input?: {
  baseUrl?: string;
  evidencePool?: Evidence[];
  demoMock?: boolean;
  jobVersionId?: string;
}): boolean {
  if (activeDispatch) return false;
  activeDispatch = dispatchAuthorizedApplications(input)
    .catch((error) => ({ ok: false, blockers: [error instanceof Error ? error.message : "A2A 编排失败"], results: [], assessments: [] }))
    .finally(() => {
      activeDispatch = null;
    });
  return true;
}

/** 一次性把已授权批次里的全部申请投递出去。 */
export async function dispatchAuthorizedApplications(input?: {
  baseUrl?: string;
  evidencePool?: Evidence[];
  demoMock?: boolean;
  jobVersionId?: string;
}): Promise<DispatchOutcome> {
  const baseUrl = input?.baseUrl ?? "http://localhost:3000";
  const agent = getCandidateAgent();
  const auth = latestAuthorization();
  if (!agent) {
    return {
      ok: false,
      blockers: ["尚未生成可投递的求职者 Agent"],
      results: [],
      assessments: [],
    };
  }
  if (!auth) {
    return {
      ok: false,
      blockers: ["未授权不得创建或发送申请"],
      results: [],
      assessments: [],
    };
  }

  const profile = getCandidate();
  // 证据池按授权时冻结的披露快照构建，之后即使界面改动也不会扩大范围。
  const evidencePool =
    input?.evidencePool ?? demoEvidencePool(auth.disclosure_snapshot);

  const pending = listApplications().filter(
    (a) =>
      a.candidate_agent_id === agent.candidate_agent_id &&
      a.state === "authorized" &&
      (!input?.jobVersionId || a.job_version_id === input.jobVersionId),
  );
  if (pending.length === 0) {
    return {
      ok: false,
      blockers: ["没有处于已授权状态的申请，请先完成授权"],
      results: [],
      assessments: [],
    };
  }

  const results: DispatchResult[] = [];
  const assessments: JobAssessment[] = [];
  const blockers: string[] = [];

  for (const application of pending) {
    const gate = assertDispatchable(application.application_id);
    if (!gate.ok) {
      blockers.push(`${application.job_version_id}: ${gate.blockers.join("；")}`);
      continue;
    }
    const job = findJob(application.job_version_id);
    if (!job) {
      blockers.push(`岗位不存在：${application.job_version_id}`);
      continue;
    }
    if (job.hiring_status === "filled") {
      blockers.push(`${job.job_version_id}: 岗位已招满，暂停新的 A2A 对话`);
      continue;
    }

    let taskIdForRecord = "";
    let dialogueMarked = false;
    // 求职者 Agent 的投递消息在任务记录建立之前就已发出，
    // 因此先按发生顺序缓冲，任务记录建立后再按原顺序落库。
    const messageBuffer: A2AMessageRecord[] = [];
    const flushMessages = (taskId: string) => {
      if (!findTask(taskId)) return;
      while (messageBuffer.length > 0) {
        const next = messageBuffer.shift();
        if (!next) continue;
        // 首条投递消息发出时服务端还没分配 task_id，这里统一改写为真实 id，
        // 保证时间线上每条消息的信封都能追溯到同一个 Task。
        recordTaskMessage(taskId, {
          ...next,
          envelope: { ...next.envelope, task_id: taskId },
        });
      }
    };

    const result = await runJobConversation({
      applicationId: application.application_id,
      job,
      agent,
      profile,
      evidencePool,
      baseUrl,
      demoMock: input?.demoMock,
      hooks: {
        onTaskCreated: (task) => {
          taskIdForRecord = task.id;
          createTaskRecord({
            taskId: task.id,
            contextId: task.contextId,
            applicationId: application.application_id,
            jobVersionId: job.job_version_id,
            candidateAgentId: agent.candidate_agent_id,
            state: task.status
              ? "TASK_STATE_SUBMITTED"
              : "TASK_STATE_UNSPECIFIED",
          });
          flushMessages(task.id);
          advanceApplication(application.application_id, "dispatched");
        },
        onStateChange: (taskId, state, note) => {
          if (!findTask(taskId)) return;
          recordTaskState(taskId, { at: nowIso(), state, note });
          if (state === "TASK_STATE_INPUT_REQUIRED" && !dialogueMarked) {
            dialogueMarked = true;
            advanceApplication(application.application_id, "in_dialogue");
          }
        },
        onCandidateMessage: (msg) => {
          appendMessage(messageBuffer, msg.taskId, msg.envelope, "user", msg.text, msg.data);
        },
        onMessage: (msg) => {
          // 求职者侧消息已由 onCandidateMessage 记录，这里只收招聘方 Agent 的消息。
          if (msg.role === "user") return;
          appendMessage(messageBuffer, msg.taskId, msg.envelope, "agent", msg.text, msg.data);
        },
        onArtifact: (artifact) => {
          recordTaskArtifact(artifact.taskId, {
            artifact_id: artifact.artifactId,
            task_id: artifact.taskId,
            name: artifact.name,
            description: artifact.description,
            created_at: nowIso(),
            payload: artifact.payload,
          });
        },
        onAssessment: (assessment) => {
          saveAssessment(assessment);
          assessments.push(assessment);
        },
      },
    });

    results.push(result);
    if (taskIdForRecord) flushMessages(taskIdForRecord);

    const app = findApplication(application.application_id);
    if (app && result.finalState === "TASK_STATE_COMPLETED") {
      if (app.state === "dispatched" || app.state === "in_dialogue") {
        advanceApplication(application.application_id, "assessed");
      }
    } else if (app && app.state !== "assessed") {
      advanceApplication(application.application_id, "failed");
      blockers.push(
        `${job.job_version_id}: 任务终态为 ${result.finalState}，未产出评估结果`,
      );
    }

    if (taskIdForRecord) {
      const record = findTask(taskIdForRecord);
      if (record) record.state = result.finalState;
    }
  }

  return {
    ok: results.length > 0,
    blockers,
    results,
    assessments,
  };
}

function appendMessage(
  buffer: A2AMessageRecord[],
  taskId: string,
  envelope: A2AEnvelope,
  role: "user" | "agent",
  text: string,
  data: unknown,
): void {
  const record: A2AMessageRecord = { envelope, role, text, data: data ?? null };
  // 任务记录尚未建立时先缓冲，保证时间线顺序与实际消息顺序一致。
  if (buffer.length > 0 || !findTask(taskId)) {
    buffer.push(record);
    return;
  }
  recordTaskMessage(taskId, record);
}
