import { fail, ok } from "@/app/api/_lib/respond";
import { fetchZhihuHotListByQuery } from "@/lib/server/zhihu-hot";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") || "10");
  const query = new URL(request.url).searchParams.get("query") || "";
  try {
    return ok(await fetchZhihuHotListByQuery(Number.isFinite(limit) ? limit : 10, query));
  } catch {
    return fail(["求职热榜暂时无法获取，请检查服务端 Access Secret 或稍后重试。"], 502);
  }
}
