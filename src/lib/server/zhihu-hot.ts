import { ZHIHU_ENDPOINTS, serverConfig } from "@/lib/config";

export type ZhihuHotItem = { title: string; url: string; thumbnail_url: string; summary: string };
type HotResult = { total: number; items: ZhihuHotItem[]; fetched_at: string; source: "live" | "server_cache" };
let hotCache: HotResult | null = null;
let jobSearchCache: { query: string; result: HotResult; expiresAt: number } | null = null;

function dataOf(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  return root.Data && typeof root.Data === "object" ? root.Data as Record<string, unknown> : root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
}

export async function fetchZhihuHotList(limit = 10) {
  return fetchZhihuHotListByQuery(limit, "");
}

export async function fetchZhihuHotListByQuery(limit = 10, query = "") {
  if (query.trim()) return fetchZhihuJobSearch(limit, query.trim());
  if (!serverConfig.zhihu.accessSecret) throw new Error("知乎热榜需要服务端配置 Access Secret");
  const url = new URL(ZHIHU_ENDPOINTS.hotList);
  url.searchParams.set("Limit", Math.min(Math.max(limit, 1), 30).toString());
  let lastError: unknown = new Error("知乎热榜接口请求失败");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), serverConfig.zhihu.timeoutMs);
    try {
      const response = await fetch(url, { headers: { accept: "application/json", "content-type": "application/json", Authorization: `Bearer ${serverConfig.zhihu.accessSecret}`, "X-Request-Timestamp": Math.floor(Date.now() / 1000).toString() }, signal: controller.signal, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error("知乎热榜接口请求失败");
      const data = dataOf(payload);
      const raw = Array.isArray(data.Items ?? data.items) ? data.Items ?? data.items : [];
      const items = (raw as unknown[]).filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")).map((item) => ({ title: String(item.Title ?? item.title ?? "未返回标题"), url: String(item.Url ?? item.url ?? ""), thumbnail_url: String(item.ThumbnailUrl ?? item.thumbnail_url ?? ""), summary: String(item.Summary ?? item.summary ?? "") }));
      const result: HotResult = { total: typeof data.Total === "number" ? data.Total : items.length, items: items.slice(0, limit), fetched_at: new Date().toISOString(), source: "live" };
      hotCache = result;
      return result;
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }
  if (hotCache) return { ...hotCache, items: hotCache.items.slice(0, limit), source: "server_cache" as const };
  throw lastError;
}

/** 求职热榜：只在用户点击时调用知乎站内搜索，避免把泛热榜内容误当成求职建议。 */
async function fetchZhihuJobSearch(limit: number, query: string): Promise<HotResult> {
  if (!serverConfig.zhihu.accessSecret) throw new Error("求职热榜需要服务端配置 Access Secret");
  if (jobSearchCache && jobSearchCache.query === query && jobSearchCache.expiresAt > Date.now()) {
    return { ...jobSearchCache.result, items: jobSearchCache.result.items.slice(0, limit), source: "server_cache" };
  }

  const url = new URL(ZHIHU_ENDPOINTS.search);
  url.searchParams.set("Query", query);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), serverConfig.zhihu.timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Bearer ${serverConfig.zhihu.accessSecret}`,
        "X-Request-Timestamp": Math.floor(Date.now() / 1000).toString(),
      },
      cache: "no-store",
    });
    const payload = (await response.json()) as unknown;
    if (!response.ok) throw new Error("知乎求职搜索接口请求失败");
    const raw = searchItems(payload);
    const result: HotResult = {
      total: raw.length,
      items: raw.slice(0, limit).map((item) => ({
        title: String(item.Title ?? item.title ?? "未返回标题"),
        url: String(item.Url ?? item.url ?? ""),
        thumbnail_url: String(item.ThumbnailUrl ?? item.thumbnail_url ?? ""),
        summary: String(item.ContentText ?? item.Summary ?? item.summary ?? "").slice(0, 220),
      })),
      fetched_at: new Date().toISOString(),
      source: "live",
    };
    jobSearchCache = { query, result, expiresAt: Date.now() + serverConfig.zhihu.cacheTtlSeconds * 1000 };
    return result;
  } finally {
    clearTimeout(timer);
  }
}

function searchItems(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.Data ?? root.data;
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && "Items" in data
      ? (data as { Items?: unknown[] }).Items ?? []
      : data && typeof data === "object" && "items" in data
        ? (data as { items?: unknown[] }).items ?? []
        : [];
  return list.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
}
