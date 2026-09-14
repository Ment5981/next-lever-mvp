import {
  A2A_PROTOCOL_VERSION,
  Role,
  TaskState,
  taskStateToJSON,
  type Artifact,
  type Message,
  type Part,
  type Task,
} from "@a2a-js/sdk";
import type { A2AEnvelope } from "@/lib/schema/domain";

/**
 * 协议适配边界。
 *
 * 已验证范围：@a2a-js/sdk 1.1.0，protocolVersion "1.0"。
 * TaskState 在该版本是带前缀的数值枚举（TASK_STATE_SUBMITTED = 1 等），
 * Part 是 { $case, value } 形式的可辨识联合。不同版本命名可能不同，
 * 因此所有构造与读取都集中在本文件，替换 SDK 版本或传输实现时只改这里。
 */
export const PROTOCOL_VERSION = A2A_PROTOCOL_VERSION;

export const A2A_COMPAT_NOTE =
  "基于 @a2a-js/sdk 1.1.0 官方类型与 DefaultRequestHandler 实现，协议版本 1.0，已验证 SendMessage / GetTask 与 Task、Message、Artifact、TaskState 的子集；未验证 gRPC、推送通知与签名扩展。";

export function textPart(value: string): Part {
  return {
    content: { $case: "text", value },
    metadata: undefined,
    filename: "",
    mediaType: "text/plain",
  };
}

export function dataPart(value: unknown): Part {
  return {
    content: { $case: "data", value },
    metadata: undefined,
    filename: "",
    mediaType: "application/json",
  };
}

export function readTextParts(parts: Part[]): string {
  return parts
    .map((p) => (p.content?.$case === "text" ? p.content.value : ""))
    .filter(Boolean)
    .join("\n");
}

export function readDataPart<T = unknown>(parts: Part[]): T | null {
  for (const p of parts) {
    if (p.content?.$case === "data") return p.content.value as T;
  }
  return null;
}

/** 信封放在 Message.metadata，保证每条消息都可追溯。 */
export function buildMessage(input: {
  envelope: A2AEnvelope;
  role: "user" | "agent";
  text: string;
  data?: unknown;
}): Message {
  const parts: Part[] = [textPart(input.text)];
  if (input.data !== undefined) parts.push(dataPart(input.data));
  return {
    messageId: input.envelope.message_id,
    contextId: "",
    taskId: input.envelope.task_id,
    role: input.role === "user" ? Role.ROLE_USER : Role.ROLE_AGENT,
    parts,
    metadata: { envelope: input.envelope },
    extensions: [],
    referenceTaskIds: [],
  };
}

export function readEnvelope(message: Message): A2AEnvelope | null {
  const raw = message.metadata?.envelope;
  return (raw as A2AEnvelope | undefined) ?? null;
}

export function buildArtifact(input: {
  artifactId: string;
  name: string;
  description: string;
  payload: unknown;
  summary: string;
}): Artifact {
  return {
    artifactId: input.artifactId,
    name: input.name,
    description: input.description,
    parts: [textPart(input.summary), dataPart(input.payload)],
    metadata: undefined,
    extensions: [],
  };
}

/** 数值枚举转成稳定的可展示字符串，UI 与持久化都使用 JSON 名称。 */
export function stateName(state: TaskState): string {
  return taskStateToJSON(state);
}

export const STATE_TEXT: Record<string, string> = {
  TASK_STATE_SUBMITTED: "已提交",
  TASK_STATE_WORKING: "处理中",
  TASK_STATE_INPUT_REQUIRED: "等待补充信息",
  TASK_STATE_COMPLETED: "已完成",
  TASK_STATE_FAILED: "失败",
  TASK_STATE_CANCELED: "已取消",
  TASK_STATE_REJECTED: "已拒绝",
  TASK_STATE_AUTH_REQUIRED: "需要授权",
  TASK_STATE_UNSPECIFIED: "未知",
};

export function stateText(name: string): string {
  return STATE_TEXT[name] ?? name;
}

export function isTerminalState(state: TaskState): boolean {
  return (
    state === TaskState.TASK_STATE_COMPLETED ||
    state === TaskState.TASK_STATE_FAILED ||
    state === TaskState.TASK_STATE_CANCELED ||
    state === TaskState.TASK_STATE_REJECTED
  );
}

export function taskSnapshot(task: Task): {
  taskId: string;
  contextId: string;
  state: string;
  artifactCount: number;
  messageCount: number;
} {
  return {
    taskId: task.id,
    contextId: task.contextId,
    state: task.status ? stateName(task.status.state) : "TASK_STATE_UNSPECIFIED",
    artifactCount: task.artifacts.length,
    messageCount: task.history.length,
  };
}

export { Role, TaskState };
