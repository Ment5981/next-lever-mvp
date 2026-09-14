import { jobAgentCard } from "@/lib/a2a/agent-cards";
import { findJob } from "@/lib/store/store";
import { baseUrlOf, fail, ok } from "@/app/api/_lib/respond";

export const dynamic = "force-dynamic";

/**
 * 招聘方 Agent 的 Agent Card。
 * 按 A2A 约定，Card 描述的能力必须与实际实现一致，因此直接由岗位版本生成。
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ jobVersionId: string }> },
) {
  const { jobVersionId } = await context.params;
  const job = findJob(jobVersionId);
  if (!job) return fail([`岗位版本不存在：${jobVersionId}`], 404);
  return ok(jobAgentCard(job, baseUrlOf(request)));
}
