import { buildGrowthReport } from "@/lib/engine/growth";
import { zhihuCounters } from "@/lib/providers/zhihu";
import {
  getCandidate,
  getCandidateAgent,
  latestAuthorization,
  listApplications,
  listAssessments,
  listDecisions,
  listJobs,
  saveReport,
} from "@/lib/store/store";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z
  .object({ force_refresh: z.boolean().default(false) })
  .default({ force_refresh: false });

/**
 * 生成成长报告。这是知乎能力唯一的自动调用时机：
 * 只在生成报告或用户主动刷新时调用，不轮询、不在切页时重复调用。
 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse((await readJson(request)) ?? {});
  const forceRefresh = parsed.success ? parsed.data.force_refresh : false;

  const agent = getCandidateAgent();
  const auth = latestAuthorization();
  if (!agent || !auth) {
    return fail(["尚未完成授权与投递，无法生成成长报告"]);
  }

  const outcome = await buildGrowthReport({
    candidateAgentId: agent.candidate_agent_id,
    jobs: listJobs(),
    assessments: listAssessments(),
    decisions: listDecisions(),
    applications: listApplications(),
    authorizedCount: auth.job_count,
    userId: getCandidate().candidate_id,
    forceRefresh,
  });
  if (!outcome.ok || !outcome.report) return fail(outcome.blockers);

  const report = saveReport(outcome.report);
  return ok({ report, zhihu_counters: zhihuCounters() });
}
