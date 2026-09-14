import { ZHIHU_ENDPOINTS, serverConfig } from "@/lib/config";

export type ZhihuContentItem = {
  content_type: string;
  url: string;
  created_at: number | null;
  like_count: number | null;
  comment_count: number | null;
  favorite_count: number | null;
  title: string;
  summary: string;
};

export type ZhihuFolloweeItem = {
  fullname: string;
  url_token: string;
  url: string;
  avatar_url: string;
  headline: string;
  follower_count: number | null;
};

type ListResult<T> = { items: T[]; isEnd: boolean; nextOffset: string | null; totals: number | null };

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function dataOf(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  return root.Data && typeof root.Data === "object" ? root.Data as Record<string, unknown> : root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
}

function pagingOf(data: Record<string, unknown>) {
  const paging = (data.Paging ?? data.paging) as Record<string, unknown> | undefined;
  return {
    isEnd: paging?.IsEnd === true || paging?.is_end === true,
    nextOffset: typeof (paging?.NextOffset ?? paging?.next_offset) === "string" ? String(paging?.NextOffset ?? paging?.next_offset) : null,
    totals: numberOrNull(paging?.Totals ?? paging?.totals),
  };
}

async function fetchUserApi<T>(url: string, token: string, params: Record<string, string>) {
  const target = new URL(url);
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value));
  const response = await fetch(target, {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: `Bearer ${serverConfig.zhihu.accessSecret}`,
      "X-OAuth-Token": token,
      "X-Request-Timestamp": Math.floor(Date.now() / 1000).toString(),
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) throw new Error("知乎用户数据接口请求失败");
  return dataOf(payload) as T & Record<string, unknown>;
}

export async function fetchContents(token: string, offset: string, limit: string): Promise<ListResult<ZhihuContentItem>> {
  const data = await fetchUserApi<Record<string, unknown>>(ZHIHU_ENDPOINTS.userContents, token, { Offset: offset, Limit: limit, ContentType: "all", SortField: "ts", SortOrder: "desc" });
  const rawItems = Array.isArray(data.Items ?? data.items) ? data.Items ?? data.items : [];
  const items = (rawItems as unknown[]).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item) => ({
    content_type: String(item.ContentType ?? item.content_type ?? ""),
    url: String(item.Url ?? item.url ?? ""),
    created_at: numberOrNull(item.CreatedAt ?? item.created_at),
    like_count: numberOrNull(item.LikeCount ?? item.like_count),
    comment_count: numberOrNull(item.CommentCount ?? item.comment_count),
    favorite_count: numberOrNull(item.FavoriteCount ?? item.favorite_count),
    title: String(item.Title ?? item.title ?? "未返回标题"),
    summary: String(item.Summary ?? item.summary ?? ""),
  }));
  const paging = pagingOf(data);
  return { items, ...paging };
}

export async function fetchFollowees(token: string, offset: string, limit: string): Promise<ListResult<ZhihuFolloweeItem>> {
  const data = await fetchUserApi<Record<string, unknown>>(ZHIHU_ENDPOINTS.userFollowees, token, { Offset: offset, Limit: limit });
  const rawItems = Array.isArray(data.Items ?? data.items) ? data.Items ?? data.items : [];
  const items = (rawItems as unknown[]).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item) => ({
    fullname: String(item.Fullname ?? item.fullname ?? "未返回姓名"),
    url_token: String(item.UrlToken ?? item.url_token ?? ""),
    url: String(item.Url ?? item.url ?? ""),
    avatar_url: String(item.AvatarUrl ?? item.avatar_url ?? ""),
    headline: String(item.Headline ?? item.headline ?? ""),
    follower_count: numberOrNull(item.FollowerCount ?? item.follower_count),
  }));
  const paging = pagingOf(data);
  return { items, ...paging };
}
