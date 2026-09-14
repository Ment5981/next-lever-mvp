import { ZHIHU_ENDPOINTS, serverConfig } from "@/lib/config";

export type ZhihuHotItem = { title: string; url: string; thumbnail_url: string; summary: string };
type HotResult = { total: number; items: ZhihuHotItem[]; fetched_at: string; source: "live" | "server_cache" };
let hotCache: HotResult | null = null;

function dataOf(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  return root.Data && typeof root.Data === "object" ? root.Data as Record<string, unknown> : root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
}

export async function fetchZhihuHotList(limit = 10) {
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
