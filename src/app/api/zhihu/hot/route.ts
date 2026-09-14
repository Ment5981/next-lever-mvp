import { fail, ok } from "@/app/api/_lib/respond";
import { fetchZhihuHotList } from "@/lib/server/zhihu-hot";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limit = Number(new URL(request.url).searchParams.get("limit") || "10");
  try {
    return ok(await fetchZhihuHotList(Number.isFinite(limit) ? limit : 10));
  } catch {
    return fail(["知乎热榜暂时无法获取，请检查服务端 Access Secret 或稍后重试。"], 502);
  }
}
