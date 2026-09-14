import { beginA2ADispatch, isA2ADispatchRunning } from "@/lib/a2a/orchestrator";
import { baseUrlOf, fail, ok, readJson } from "../../_lib/respond";
import { createConversationApplication, findJob, getCandidateAgent, latestAuthorization } from "@/lib/store/store";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({ job_version_id: z.string().min(1) });

/** 开启单个岗位的新一轮 A2A 会话；授权范围外的岗位一律拒绝。 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["A2A 对话请求格式不正确"]);
  const { job_version_id: jobVersionId } = parsed.data;
  if (!findJob(jobVersionId)) return fail(["岗位不存在"]);
  if (!getCandidateAgent()) return fail(["请先生成可投递的求职者 Agent"]);
  const auth = latestAuthorization();
  if (!auth || !auth.job_version_ids.includes(jobVersionId)) {
    return fail(["该岗位尚未获得授权，请先在授权页明确选择后再开始对话"]);
  }
  if (isA2ADispatchRunning()) return ok({ started: false, running: true, note: "上一轮 A2A 仍在处理" });

  const application = createConversationApplication(auth.authorization_id, jobVersionId);
  if (!application.ok) return fail(application.blockers);
  const started = beginA2ADispatch({ baseUrl: baseUrlOf(request), jobVersionId });
  if (!started) return ok({ started: false, running: true, note: "A2A 已在处理中" });
  return ok({ started: true, running: true, application_id: application.application?.application_id });
}
