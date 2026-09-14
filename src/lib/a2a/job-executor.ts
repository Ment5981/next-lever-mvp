import {
  AgentEvent,
  type AgentExecutor,
  type ExecutionEventBus,
  type RequestContext,
} from "@a2a-js/sdk/server";
import { TaskState, type Message, type Task } from "@a2a-js/sdk";
import { DEMO_JUDGMENTS } from "@/lib/demo/judgments";
import { composeAssessment, type AssessmentJudgment } from "@/lib/engine/assessment";
import { SCORING_THRESHOLDS } from "@/lib/engine/scoring";
import { MAX_CLARIFICATION_ROUNDS } from "@/lib/engine/state-machine";
import { makeId, nowIso, sanitizeUntrusted } from "@/lib/engine/util";
import { assessmentJudgment } from "@/lib/providers/llm";
import type {
  A2AEnvelope,
  Evidence,
  JobAssessment,
  JobVersion,
} from "@/lib/schema/domain";
import {
  buildArtifact,
  buildMessage,
  readDataPart,
  readEnvelope,
  readTextParts,
  stateName,
} from "./protocol";

/**
 * 招聘方 Agent 执行器。
 *
 * 关键约束：
 * - 每次 execute 都必须先发布 task 或 message 事件（SDK 强制要求）。
 * - 追问最多 MAX_CLARIFICATION_ROUNDS 轮，通过 INPUT_REQUIRED 状态挂起任务。
 * - 评估结果作为 Artifact 产出，分数与建议由确定性规则计算，模型只提供观察素材。
 * - 只使用申请消息里携带的授权证据，不读取披露范围之外的任何内容。
 */

/** 申请消息的 data part 结构。 */
export type ApplicationPayload = {
  application_id: string;
  candidate_agent_id: string;
  job_version_id: string;
  material_version: number;
  display_name: string | null;
  target_role: string | null;
  evidence: Evidence[];
  portfolio: { title: string; url: string; note: string }[];
};

export type ClarificationPayload = {
  question_id: string;
  answer_evidence_ids: string[];
};

export type JobExecutorHooks = {
  onTaskCreated?: (task: Task, envelope: A2AEnvelope | null) => void;
  onStateChange?: (taskId: string, state: string, note: string) => void;
  onMessage?: (input: {
    taskId: string;
    envelope: A2AEnvelope;
    role: "user" | "agent";
    text: string;
    data: unknown;
  }) => void;
  onArtifact?: (input: {
    taskId: string;
    artifactId: string;
    name: string;
    description: string;
    payload: unknown;
  }) => void;
  onAssessment?: (assessment: JobAssessment) => void;
};

type PendingClarification = {
  questionId: string;
  question: string;
  criterionId: string;
  rounds: number;
  payload: ApplicationPayload;
  /** 判断素材在追问前已经算好，追问回答后直接复用，避免重复调用模型。 */
  judgment: AssessmentJudgment;
  judgmentMode: string;
};

export class JobAgentExecutor implements AgentExecutor {
  private readonly job: JobVersion;
  private readonly hooks: JobExecutorHooks;
  private readonly demoMock: boolean;
  private readonly pending = new Map<string, PendingClarification>();

  constructor(
    job: JobVersion,
    hooks: JobExecutorHooks = {},
    options: { demoMock?: boolean } = {},
  ) {
    this.job = job;
    this.hooks = hooks;
    this.demoMock = options.demoMock ?? false;
  }

  async execute(context: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    const userMessage = context.userMessage;
    const envelope = readEnvelope(userMessage);
    const existing = context.task;

    // 首个事件必须是 task 或 message，follow-up 轮次同样如此。
    const task: Task = existing
      ? { ...existing, contextId: context.contextId }
      : {
          id: context.taskId,
          contextId: context.contextId,
          status: {
            state: TaskState.TASK_STATE_SUBMITTED,
            message: undefined,
            timestamp: nowIso(),
          },
          artifacts: [],
          history: [userMessage],
          metadata: {
            job_version_id: this.job.job_version_id,
            company_name: this.job.company_name,
            job_title: this.job.title,
          },
        };
    eventBus.publish(AgentEvent.task(task));

    if (!existing) {
      this.hooks.onTaskCreated?.(task, envelope);
      this.hooks.onStateChange?.(
        task.id,
        stateName(TaskState.TASK_STATE_SUBMITTED),
        "收到求职者 Agent 的投递申请",
      );
    }

    if (envelope) {
      this.hooks.onMessage?.({
        taskId: task.id,
        envelope,
        role: "user",
        text: sanitizeUntrusted(readTextParts(userMessage.parts), 4000),
        data: readDataPart(userMessage.parts),
      });
    }

    const pending = this.pending.get(task.id);
    if (pending) {
      await this.handleClarificationAnswer({
        task,
        eventBus,
        userMessage,
        pending,
      });
      eventBus.finished();
      return;
    }

    const payload = readDataPart<ApplicationPayload>(userMessage.parts);
    if (!payload || !Array.isArray(payload.evidence)) {
      this.publishStatus(
        eventBus,
        task,
        TaskState.TASK_STATE_REJECTED,
        "申请消息缺少结构化证据数据，无法进入评估。",
      );
      eventBus.finished();
      return;
    }

    this.publishStatus(
      eventBus,
      task,
      TaskState.TASK_STATE_WORKING,
      `已按岗位 ${this.job.title} 的能力模型开始核对授权证据`,
    );

    // 先产出判断素材，再据此决定是否追问：只有「无法核验」才值得追问，
    // 求职者已确认的能力范围差异不应该反复追问。
    const preset = DEMO_JUDGMENTS[this.job.job_version_id];
    const judged = await assessmentJudgment({
      job: this.job,
      evidence: payload.evidence,
      preset,
      demoMock: this.demoMock,
    });

    const gap = this.findClarificationTarget(judged.data);
    if (gap) {
      this.askClarification({
        task,
        eventBus,
        payload,
        gap,
        judgment: judged.data,
        judgmentMode: judged.meta.mode,
      });
      eventBus.finished();
      return;
    }

    await this.finishAssessment({
      task,
      eventBus,
      payload,
      extraNote: null,
      judgment: judged.data,
      judgmentMode: judged.meta.mode,
    });
    eventBus.finished();
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    this.pending.delete(taskId);
    eventBus.publish(
      AgentEvent.statusUpdate({
        taskId,
        contextId: "",
        status: {
          state: TaskState.TASK_STATE_CANCELED,
          message: undefined,
          timestamp: nowIso(),
        },
        metadata: undefined,
      }),
    );
    this.hooks.onStateChange?.(
      taskId,
      stateName(TaskState.TASK_STATE_CANCELED),
      "求职者撤回申请，任务取消",
    );
    eventBus.finished();
  }

  /**
   * 选择需要追问的能力项。
   *
   * 只在「拿不到证据所以无法判断」时追问：
   * - 硬性条件被判为 insufficient_evidence；
   * - 或高权重能力项没有任何可引用证据。
   * 求职者本人已确认的能力范围差异（hard_status = not_met）不追问，
   * 因为那不是证据缺口，再问一次也不会得到新材料。
   */
  private findClarificationTarget(
    judgment: AssessmentJudgment,
  ): { criterionId: string; question: string } | null {
    const byWeight = [...this.job.criteria].sort((a, b) => b.weight - a.weight);
    for (const criterion of byWeight) {
      const item = judgment.criteria.find(
        (c) => c.criterion_id === criterion.criterion_id,
      );
      const unverifiableHard =
        criterion.must_have && item?.hard_status === "insufficient_evidence";
      const noEvidence =
        criterion.weight >= SCORING_THRESHOLDS.highWeight &&
        (!item || item.evidence_ids.length === 0);
      if (!unverifiableHard && !noEvidence) continue;
      return {
        criterionId: criterion.criterion_id,
        question:
          criterion.evaluation_questions[0] ??
          `请补充能证明「${criterion.name}」的可核验材料。`,
      };
    }
    return null;
  }

  private askClarification(input: {
    task: Task;
    eventBus: ExecutionEventBus;
    payload: ApplicationPayload;
    gap: { criterionId: string; question: string };
    judgment: AssessmentJudgment;
    judgmentMode: string;
  }): void {
    const questionId = makeId("q");
    const envelope: A2AEnvelope = {
      task_id: input.task.id,
      message_id: makeId("msg"),
      sender: `job_agent:${this.job.job_version_id}`,
      receiver: `candidate_agent:${input.payload.candidate_agent_id}`,
      job_version_id: this.job.job_version_id,
      material_version: input.payload.material_version,
      timestamp: nowIso(),
      message_type: "clarification_request",
      evidence_ids: [],
    };
    const text = `${input.gap.question}（本轮追问针对证据缺口，不构成对候选人能力的结论）`;
    const message = buildMessage({
      envelope,
      role: "agent",
      text,
      data: { question_id: questionId, criterion_id: input.gap.criterionId },
    });

    this.pending.set(input.task.id, {
      questionId,
      question: input.gap.question,
      criterionId: input.gap.criterionId,
      rounds: 1,
      payload: input.payload,
      judgment: input.judgment,
      judgmentMode: input.judgmentMode,
    });

    this.publishStatus(
      input.eventBus,
      input.task,
      TaskState.TASK_STATE_INPUT_REQUIRED,
      text,
      message,
    );
    this.hooks.onMessage?.({
      taskId: input.task.id,
      envelope,
      role: "agent",
      text,
      data: { question_id: questionId, criterion_id: input.gap.criterionId },
    });
  }

  private async handleClarificationAnswer(input: {
    task: Task;
    eventBus: ExecutionEventBus;
    userMessage: Message;
    pending: PendingClarification;
  }): Promise<void> {
    const answerText = sanitizeUntrusted(readTextParts(input.userMessage.parts), 4000);
    const answerData = readDataPart<ClarificationPayload>(input.userMessage.parts);
    this.pending.delete(input.task.id);

    this.publishStatus(
      input.eventBus,
      input.task,
      TaskState.TASK_STATE_WORKING,
      "已收到求职者 Agent 在授权范围内的回答，继续评估",
    );

    const note = [
      `追问「${input.pending.question}」`,
      `求职者 Agent 回答：${answerText || "（未提供额外内容）"}`,
      answerData && answerData.answer_evidence_ids.length > 0
        ? `引用证据：${answerData.answer_evidence_ids.join("、")}`
        : "回答未引入新的授权证据，相关能力项仍按信息不足处理。",
      input.pending.rounds >= MAX_CLARIFICATION_ROUNDS
        ? `已达追问上限 ${MAX_CLARIFICATION_ROUNDS} 轮，不再继续追问。`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    await this.finishAssessment({
      task: input.task,
      eventBus: input.eventBus,
      payload: input.pending.payload,
      extraNote: note,
      judgment: input.pending.judgment,
      judgmentMode: input.pending.judgmentMode,
    });
  }

  private async finishAssessment(input: {
    task: Task;
    eventBus: ExecutionEventBus;
    payload: ApplicationPayload;
    extraNote: string | null;
    judgment: AssessmentJudgment;
    judgmentMode: string;
  }): Promise<void> {
    const assessment = composeAssessment({
      assessmentId: makeId("assess"),
      taskId: input.task.id,
      job: this.job,
      candidateAgentId: input.payload.candidate_agent_id,
      judgment: input.judgment,
      evidencePool: input.payload.evidence,
    });

    const enriched: JobAssessment = input.extraNote
      ? {
          ...assessment,
          suggestion_reason: `${assessment.suggestion_reason}\n${input.extraNote}`,
        }
      : assessment;

    const artifactId = makeId("artifact");
    const artifact = buildArtifact({
      artifactId,
      name: `岗位匹配评估 · ${this.job.title}`,
      description: `岗位版本 ${this.job.job_version_id} 的评估结果，含逐项证据引用与差距说明。模型模式：${input.judgmentMode}`,
      payload: enriched,
      summary: [
        `匹配度 ${enriched.soft_match_score}（加权，含证据可靠度折算）`,
        `置信度 ${enriched.confidence}`,
        `Agent 建议：${enriched.suggestion}`,
        enriched.suggestion_reason,
      ].join("\n"),
    });

    input.eventBus.publish(
      AgentEvent.artifactUpdate({
        taskId: input.task.id,
        contextId: input.task.contextId,
        artifact,
        append: false,
        lastChunk: true,
        metadata: undefined,
      }),
    );
    this.hooks.onArtifact?.({
      taskId: input.task.id,
      artifactId,
      name: artifact.name,
      description: artifact.description,
      payload: enriched,
    });
    this.hooks.onAssessment?.(enriched);

    const envelope: A2AEnvelope = {
      task_id: input.task.id,
      message_id: makeId("msg"),
      sender: `job_agent:${this.job.job_version_id}`,
      receiver: `candidate_agent:${input.payload.candidate_agent_id}`,
      job_version_id: this.job.job_version_id,
      material_version: input.payload.material_version,
      timestamp: nowIso(),
      message_type: "assessment_result",
      evidence_ids: enriched.criterion_assessments.flatMap((c) => c.evidence_ids),
    };
    const resultText = [
      `评估完成：匹配度 ${enriched.soft_match_score}，置信度 ${enriched.confidence}。`,
      `Agent 建议：${enriched.suggestion}。该建议仅为 Agent 推断，最终结论由招聘方真人确认。`,
      enriched.suggestion_reason,
    ].join("\n");
    const message = buildMessage({
      envelope,
      role: "agent",
      text: resultText,
      data: { assessment_id: enriched.assessment_id, artifact_id: artifactId },
    });

    this.publishStatus(
      input.eventBus,
      input.task,
      TaskState.TASK_STATE_COMPLETED,
      resultText,
      message,
    );
    this.hooks.onMessage?.({
      taskId: input.task.id,
      envelope,
      role: "agent",
      text: resultText,
      data: { assessment_id: enriched.assessment_id, artifact_id: artifactId },
    });
  }

  private publishStatus(
    eventBus: ExecutionEventBus,
    task: Task,
    state: TaskState,
    note: string,
    message?: Message,
  ): void {
    eventBus.publish(
      AgentEvent.statusUpdate({
        taskId: task.id,
        contextId: task.contextId,
        status: { state, message, timestamp: nowIso() },
        metadata: undefined,
      }),
    );
    this.hooks.onStateChange?.(task.id, stateName(state), note);
  }
}
