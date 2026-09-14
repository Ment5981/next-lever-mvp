import { beginA2ADispatch, dispatchAuthorizedApplications, isA2ADispatchRunning } from "@/lib/a2a/orchestrator";
import { listApplications, listTasks } from "@/lib/store/store";
import { baseUrlOf, fail, ok } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * 把已授权的申请通过 A2A 投递给各招聘方 Agent。
 * 未授权时 orchestrator 内部的门禁会拒绝，不会发出任何消息。
 */
export async function POST(request: Request) {
  const parsed = z.object({ background: z.boolean().default(false) }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail(["A2A 请求格式不正确"]);
  if (parsed.data.background) {
    const started = beginA2ADispatch({ baseUrl: baseUrlOf(request) });
    return ok({ started, running: isA2ADispatchRunning() });
  }
  const outcome = await dispatchAuthorizedApplications({
    baseUrl: baseUrlOf(request),
  });
  if (!outcome.ok) return fail(outcome.blockers);
  return ok({
    results: outcome.results.map((r) => ({
      job_version_id: r.jobVersionId,
      task_id: r.taskId,
      context_id: r.contextId,
      final_state: r.finalState,
      clarification_rounds: r.clarificationRounds,
      transport: r.transport,
    })),
    assessments: outcome.assessments,
    applications: listApplications(),
    tasks: listTasks(),
    // 部分岗位失败时仍返回成功结果，Demo 不因单个岗位中断。
    blockers: outcome.blockers,
  });
}

export async function GET() {
  return ok({ running: isA2ADispatchRunning() });
}
