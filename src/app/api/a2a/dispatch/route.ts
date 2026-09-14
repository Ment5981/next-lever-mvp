import { dispatchAuthorizedApplications } from "@/lib/a2a/orchestrator";
import { listApplications, listTasks } from "@/lib/store/store";
import { baseUrlOf, fail, ok } from "../../_lib/respond";

export const dynamic = "force-dynamic";

/**
 * 把已授权的申请通过 A2A 投递给各招聘方 Agent。
 * 未授权时 orchestrator 内部的门禁会拒绝，不会发出任何消息。
 */
export async function POST(request: Request) {
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
