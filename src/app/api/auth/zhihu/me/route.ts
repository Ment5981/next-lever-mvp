import { ok } from "@/app/api/_lib/respond";
import { oauthSessionStatus } from "@/lib/server/zhihu-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return ok(oauthSessionStatus(request));
}
