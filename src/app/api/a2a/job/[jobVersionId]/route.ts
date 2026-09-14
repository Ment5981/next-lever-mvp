import { jobAgentCard } from "@/lib/a2a/agent-cards";
import { JobAgentExecutor } from "@/lib/a2a/job-executor";
import { createJsonRpcHandler } from "@/lib/a2a/transport";
import { findJob } from "@/lib/store/store";
import { baseUrlOf, fail, readJson } from "@/app/api/_lib/respond";

export const dynamic = "force-dynamic";

/**
 * 招聘方 Agent 的 A2A JSON-RPC 端点。
 *
 * 方法名沿用官方 SDK 的 PascalCase 绑定（SendMessage / GetTask / CancelTask 等），
 * 请求与响应均由 SDK 的 JsonRpcTransportHandler 处理，不自行拼装协议报文。
 * 这里每次请求新建 handler，任务状态存在各自的 InMemoryTaskStore 里；
 * 平台内部的三个 Task 由 /api/demo/dispatch 的进程内 transport 统一编排，
 * 本端点主要用于对外验证协议兼容性。
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ jobVersionId: string }> },
) {
  const { jobVersionId } = await context.params;
  const job = findJob(jobVersionId);
  if (!job) return fail([`岗位版本不存在：${jobVersionId}`], 404);

  const body = await readJson(request);
  if (body === null) return fail(["请求体不是合法 JSON"], 400);

  const handler = createJsonRpcHandler({
    agentCard: jobAgentCard(job, baseUrlOf(request)),
    executor: new JobAgentExecutor(job),
  });

  try {
    const response = await handler.handle(body);
    return Response.json(response, {
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    // 协议层错误按 JSON-RPC 形状返回，不泄露内部堆栈。
    const message =
      error instanceof Error ? error.message : "A2A 请求处理失败";
    return Response.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32603, message },
      },
      { status: 500 },
    );
  }
}

/** 便于直接在浏览器查看该岗位 Agent 的能力声明。 */
export async function GET(
  request: Request,
  context: { params: Promise<{ jobVersionId: string }> },
) {
  const { jobVersionId } = await context.params;
  const job = findJob(jobVersionId);
  if (!job) return fail([`岗位版本不存在：${jobVersionId}`], 404);
  return Response.json(jobAgentCard(job, baseUrlOf(request)));
}
