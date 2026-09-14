import { fail, ok } from "@/app/api/_lib/respond";
import { fetchContents, fetchFollowees } from "@/lib/server/zhihu-user";
import { sessionToken } from "@/lib/server/zhihu-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = sessionToken(request);
  if (!token) return fail(["请先登录知乎。"], 401);
  if (!process.env.ZHIHU_ACCESS_SECRET?.trim()) return fail(["用户创作和关注接口需要服务端配置 ZHIHU_ACCESS_SECRET。"], 503);
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") === "followees" ? "followees" : "contents";
  const offset = url.searchParams.get("offset") || "0";
  const limit = url.searchParams.get("limit") || "10";
  try {
    return ok(kind === "contents" ? { kind, ...(await fetchContents(token, offset, limit)) } : { kind, ...(await fetchFollowees(token, offset, limit)) });
  } catch {
    return fail(["知乎用户数据暂时无法获取，请稍后重试。"], 502);
  }
}
