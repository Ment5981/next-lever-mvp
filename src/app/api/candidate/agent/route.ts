import { candidateAgentCard } from "@/lib/a2a/agent-cards";
import { getCandidate, publishCandidateAgent } from "@/lib/store/store";
import { baseUrlOf, fail, ok } from "../../_lib/respond";

export const dynamic = "force-dynamic";

/** 生成可投递的求职者 Agent。材料、面试、披露范围三项确认缺一不可。 */
export async function POST(request: Request) {
  const result = publishCandidateAgent();
  if (!result.ok || !result.agent) return fail(result.blockers);
  const card = candidateAgentCard(
    result.agent,
    getCandidate().target_role,
    baseUrlOf(request),
  );
  return ok({ candidate_agent: result.agent, agent_card: card });
}
