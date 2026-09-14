import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  JsonRpcTransportHandler,
  ServerCallContext,
  type AgentExecutor,
} from "@a2a-js/sdk/server";
import { Message, Task, type AgentCard } from "@a2a-js/sdk";

/**
 * 可替换的 A2A transport 边界。
 *
 * 目前提供进程内 JSON-RPC 实现：请求体与 a2a-protocol 的 JSON-RPC 绑定一致，
 * 由官方 SDK 的 JsonRpcTransportHandler + DefaultRequestHandler 处理，
 * 只是省掉了 HTTP 这一跳。换成真实 HTTP / gRPC 时只需替换本文件的实现，
 * 上层编排（candidate-client.ts）不需要改动。
 */
export type A2ATransport = {
  readonly name: string;
  /** JSON-RPC SendMessage。返回 Task 或 Message。 */
  sendMessage(params: SendMessageParams): Promise<Task | Message>;
  /** JSON-RPC GetTask。 */
  getTask(taskId: string): Promise<Task>;
  /** Agent Card 由服务端 handler 提供，保证与实际能力一致。 */
  agentCard(): Promise<AgentCard>;
};

/**
 * SendMessage 的入参。message 使用 SDK 结构，由 transport 负责序列化成
 * JSON-RPC 线上格式（Part 的 { $case, value } 会被转成 { text } / { data }）。
 */
export type SendMessageParams = {
  tenant?: string;
  message: Message;
  configuration?: {
    acceptedOutputModes: string[];
    taskPushNotificationConfig?: unknown;
    returnImmediately?: boolean;
  };
  metadata?: Record<string, unknown>;
};

export class JsonRpcTransportError extends Error {
  readonly code: number;
  constructor(code: number, message: string) {
    super(`A2A JSON-RPC 错误 ${code}: ${message}`);
    this.name = "JsonRpcTransportError";
    this.code = code;
  }
}

let rpcId = 0;
function nextRpcId(): number {
  rpcId += 1;
  return rpcId;
}

/**
 * 进程内 JSON-RPC transport。
 * 说明：SDK 的 JSON-RPC 方法名是 PascalCase（SendMessage / GetTask / ...）。
 */
export function createInProcessTransport(input: {
  agentCard: AgentCard;
  executor: AgentExecutor;
}): A2ATransport {
  const taskStore = new InMemoryTaskStore();
  const requestHandler = new DefaultRequestHandler(
    input.agentCard,
    taskStore,
    input.executor,
  );
  const rpc = new JsonRpcTransportHandler(requestHandler);
  const context = new ServerCallContext();

  async function call(
    method: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const response = await rpc.handle(
      { jsonrpc: "2.0", id: nextRpcId(), method, params },
      context,
    );
    if (Symbol.asyncIterator in response) {
      throw new Error(`方法 ${method} 返回了流式响应，本 transport 只使用阻塞式调用`);
    }
    if (response.error) {
      const err = response.error as { code?: number; message?: string };
      throw new JsonRpcTransportError(err.code ?? -32603, err.message ?? "未知错误");
    }
    return (response.result ?? {}) as Record<string, unknown>;
  }

  return {
    name: "in-process-jsonrpc",
    async sendMessage(params) {
      // 服务端会对 params 执行 SendMessageRequest.fromJSON，因此这里必须先
      // 序列化成线上格式；否则 Part.content 会被解析成 undefined，data part 丢失。
      const wire: Record<string, unknown> = {
        tenant: params.tenant ?? "",
        message: Message.toJSON(params.message),
      };
      if (params.configuration) wire.configuration = params.configuration;
      if (params.metadata) wire.metadata = params.metadata;

      // result 是 { task } 或 { message } 包装，且经过 toJSON 序列化，
      // 用官方 fromJSON 还原成 SDK 结构。
      const result = await call("SendMessage", wire);
      if (result.task) return Task.fromJSON(result.task);
      if (result.message) return Message.fromJSON(result.message);
      throw new Error("SendMessage 响应既不含 task 也不含 message");
    },
    async getTask(taskId) {
      const result = await call("GetTask", { tenant: "", id: taskId });
      return Task.fromJSON(result);
    },
    async agentCard() {
      return requestHandler.getAgentCard();
    },
  };
}

export function isTask(value: Task | Message): value is Task {
  return typeof (value as Task).id === "string" && "status" in value;
}

/**
 * 原始 JSON-RPC handler，供 HTTP Route Handler 复用。
 *
 * 进程内 transport 与 HTTP 端点共用同一套官方 SDK handler，
 * 因此对外暴露的协议行为与 Demo 内部实际跑的完全一致；
 * 换成跨进程部署时，只需让 candidate-client 走 HTTP 而不必改协议层。
 */
export function createJsonRpcHandler(input: {
  agentCard: AgentCard;
  executor: AgentExecutor;
}): {
  handle(body: unknown): Promise<unknown>;
  agentCard(): Promise<AgentCard>;
} {
  const requestHandler = new DefaultRequestHandler(
    input.agentCard,
    new InMemoryTaskStore(),
    input.executor,
  );
  const rpc = new JsonRpcTransportHandler(requestHandler);
  const context = new ServerCallContext();

  return {
    async handle(body) {
      if (
        typeof body !== "string" &&
        (typeof body !== "object" || body === null || Array.isArray(body))
      ) {
        throw new JsonRpcTransportError(
          -32600,
          "JSON-RPC 请求体必须是 JSON 对象或字符串",
        );
      }
      const payload = body as string | Record<string, unknown>;
      const response = await rpc.handle(payload, context);
      if (Symbol.asyncIterator in response) {
        // Agent Card 声明 streaming=false，正常不会走到这里。
        throw new JsonRpcTransportError(
          -32004,
          "本端点不支持流式响应，请使用阻塞式 SendMessage",
        );
      }
      return response;
    },
    async agentCard() {
      return requestHandler.getAgentCard();
    },
  };
}
