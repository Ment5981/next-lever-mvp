import { makeId, nowIso } from "@/lib/engine/util";
import { CandidateMarketplacePost } from "@/lib/schema/domain";
import { getCandidate, getCandidateAgent, publishCandidateMarketplacePost } from "@/lib/store/store";
import { fail, ok, readJson } from "../../_lib/respond";

export const dynamic = "force-dynamic";

const Payload = CandidateMarketplacePost.omit({
  post_id: true,
  candidate_id: true,
  published: true,
  created_at: true,
  updated_at: true,
});

export async function POST(request: Request) {
  if (!getCandidateAgent()) return fail(["请先完成求职者 Agent，再发布到求职广场"]);
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["求职卡信息不完整，请补充自我介绍"]);
  const now = nowIso();
  const post = CandidateMarketplacePost.parse({
    ...parsed.data,
    post_id: makeId("candidate_post"),
    candidate_id: getCandidate().candidate_id,
    published: true,
    created_at: now,
    updated_at: now,
  });
  return ok({ post: publishCandidateMarketplacePost(post) });
}
