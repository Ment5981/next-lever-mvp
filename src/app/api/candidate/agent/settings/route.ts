import { CandidateAgentSettings } from "@/lib/schema/domain";
import { getCandidateAgent, updateCandidateAgentSettings } from "@/lib/store/store";
import { fail, ok, readJson } from "../../../_lib/respond";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!getCandidateAgent()) return fail(["请先生成求职者 Agent，再编辑 Agent 设置"]);
  const parsed = CandidateAgentSettings.safeParse(await readJson(request));
  if (!parsed.success) return fail(["Agent 设置不完整，请检查名称和表达风格"]);
  const agent = updateCandidateAgentSettings(parsed.data);
  if (!agent) return fail(["Agent 设置更新失败"]);
  return ok({ candidate_agent: agent });
}
