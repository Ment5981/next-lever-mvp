import { SCHEMA_VERSION, ZHIHU_ENDPOINTS, serverConfig } from "@/lib/config";
import { similarity } from "@/lib/engine/text";
import { normalizeQuery, nowIso } from "@/lib/engine/util";
import {
  DEMO_CACHE_FETCHED_AT,
  ZHIHU_DEMO_CACHE,
  type ZhihuKnowledgeRecord,
} from "@/lib/demo/zhihu-demo-cache";
import type { ZhihuFetchMeta, ZhihuResource } from "@/lib/schema/domain";
import type { ZhihuDataStatus } from "@/lib/schema/enums";
import type { ProviderStatus } from "./types";

/**
 * 知乎官方能力 Provider。
 *
 * 真实可用能力（实测无需鉴权）：
 *   GET /km-indep-home/hackathon/v2/knowledge/list      知识列表
 *   GET /km-indep-home/hackathon/v2/knowledge/{work_id} 知识详情（含作者、简介）
 * 增强能力（需要 ZHIHU_ACCESS_SECRET）：
 *   GET developer.zhihu.com/api/v1/content/zhihu_search  知乎搜索
 *
 * 降级链：Live -> Server Cache -> Demo Cache -> Offline Fallback。
 * 只在生成成长报告或用户手动刷新时调用，不轮询、不在页面切换时重复调用。
 * 只展示接口真实返回的字段，未返回的字段一律标记为「未返回」（null）。
 */

const PROVIDER_NAME = "zhihu-hackathon-knowledge";

type CacheEntry = {
  cacheKey: string;
  records: RankedRecord[];
  fetchedAt: string;
  apiName: string;
  expiresAt: number;
};

type RankedRecord = ZhihuKnowledgeRecord & { relevance: number };

type Counters = {
  day: string;
  app: number;
  byUser: Record<string, number>;
  byTask: Record<string, number>;
};

type BreakerState = {
  failures: number;
  openedAt: number | null;
};

/**
 * 服务端进程级单例。Next 生产构建会把页面与 Route Handler 编译到不同 bundle，
 * 普通模块变量会因此产生多份；挂到 globalThis 后，各入口共享同一份预算、缓存与熔断状态。
 * MVP 使用进程内内存缓存，换成 Redis 只需替换本文件的状态读写。
 */
type ZhihuProviderState = {
  cache: Map<string, CacheEntry>;
  counters: Counters;
  breaker: BreakerState;
};

const globalKey = "__next_lever_zhihu_provider__";
type GlobalWithZhihuProvider = typeof globalThis & {
  [globalKey]?: ZhihuProviderState;
};

function providerStateRef(): ZhihuProviderState {
  const g = globalThis as GlobalWithZhihuProvider;
  if (!g[globalKey]) {
    g[globalKey] = {
      cache: new Map<string, CacheEntry>(),
      counters: { day: today(), app: 0, byUser: {}, byTask: {} },
      breaker: { failures: 0, openedAt: null },
    };
  }
  return g[globalKey];
}

const providerState = providerStateRef();
const cache = providerState.cache;
const counters = providerState.counters;
const breaker = providerState.breaker;

const BREAKER_COOLDOWN_MS = 60_000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function rollDayIfNeeded(): void {
  const current = today();
  if (counters.day !== current) {
    counters.day = current;
    counters.app = 0;
    counters.byUser = {};
    counters.byTask = {};
  }
}

/** 缓存键：任务 + 规范化查询 + provider + schema 版本。 */
export function buildCacheKey(input: { taskId: string; query: string }): string {
  return [
    input.taskId,
    normalizeQuery(input.query),
    PROVIDER_NAME,
    SCHEMA_VERSION,
  ].join("|");
}

export function zhihuStatus(): ProviderStatus {
  rollDayIfNeeded();
  const searchConfigured = serverConfig.zhihu.searchConfigured;
  const open = breakerOpen();
  const mode: ProviderStatus["mode"] = open ? "fallback" : "live";
  return {
    name: "知乎官方能力",
    mode,
    configured: searchConfigured,
    detail: [
      `知识列表与详情接口无需鉴权，默认走 Live；`,
      searchConfigured
        ? "已配置 Access Secret，可附加 zhihu_search 增强检索；"
        : "未配置 ZHIHU_ACCESS_SECRET，跳过 zhihu_search 增强检索；",
      `今日调用 ${counters.app}/${serverConfig.zhihu.dailyBudget}，缓存 TTL ${serverConfig.zhihu.cacheTtlSeconds}s，`,
      `超时 ${serverConfig.zhihu.timeoutMs}ms，最多重试 ${serverConfig.zhihu.maxRetries} 次，`,
      open ? "熔断已打开，当前使用缓存或演示数据。" : "熔断关闭。",
    ].join(""),
  };
}

function breakerOpen(): boolean {
  if (breaker.openedAt === null) return false;
  if (Date.now() - breaker.openedAt > BREAKER_COOLDOWN_MS) {
    breaker.openedAt = null;
    breaker.failures = 0;
    return false;
  }
  return true;
}

function recordFailure(): void {
  breaker.failures += 1;
  if (breaker.failures >= serverConfig.zhihu.breakerThreshold) {
    breaker.openedAt = Date.now();
  }
}

function recordSuccess(): void {
  breaker.failures = 0;
  breaker.openedAt = null;
}

export type ZhihuQuery = {
  /** 成长任务 id，用于缓存键与按任务计数。 */
  taskId: string;
  /** 目标能力等构成的检索词。 */
  query: string;
  /** 该资源为什么推荐给这项任务。 */
  whyForTask: string;
  userId: string;
  limit?: number;
  /** 用户主动刷新时为 true，绕过服务端缓存但仍受预算与熔断约束。 */
  forceRefresh?: boolean;
};

export type ZhihuFetchResult = {
  resources: ZhihuResource[];
  meta: ZhihuFetchMeta;
};

/** 拉取知识列表并补齐详情。任一环节失败都抛错，由上层降级。 */
async function fetchLive(limit: number): Promise<{
  records: ZhihuKnowledgeRecord[];
  apiName: string;
}> {
  const list = await withTimeout<unknown>(ZHIHU_ENDPOINTS.knowledgeList);
  if (!Array.isArray(list)) {
    throw new Error("知识列表返回结构不是数组");
  }
  const base = list
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      work_id: String(item.work_id ?? ""),
      title: typeof item.title === "string" ? item.title : "",
      description: typeof item.description === "string" ? item.description : "",
      labels: Array.isArray(item.labels) ? item.labels.map((l) => String(l)) : [],
      chapter_name: "",
      author_name: "",
      introduction: "",
      content_length: 0,
    }))
    .filter((item) => item.work_id && item.title);

  if (base.length === 0) throw new Error("知识列表为空");

  // 详情只对排序后的前若干条调用，避免一次报告打满配额。
  const detailTargets = base.slice(0, Math.min(limit + 2, base.length));
  const details = await Promise.allSettled(
    detailTargets.map((item) =>
      withTimeout<Record<string, unknown>>(
        `${ZHIHU_ENDPOINTS.knowledgeDetail}/${item.work_id}`,
      ),
    ),
  );
  details.forEach((result, index) => {
    if (result.status !== "fulfilled" || typeof result.value !== "object" || result.value === null) {
      return;
    }
    const d = result.value;
    const target = detailTargets[index];
    target.chapter_name = typeof d.chapter_name === "string" ? d.chapter_name : "";
    target.author_name = typeof d.author_name === "string" ? d.author_name : "";
    target.introduction = typeof d.introduction === "string" ? d.introduction : "";
    target.content_length = typeof d.content === "string" ? d.content.length : 0;
  });

  return { records: base, apiName: "hackathon/v2/knowledge/list + knowledge/{work_id}" };
}

async function withTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), serverConfig.zhihu.timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`知乎接口 HTTP ${response.status}`);
    const payload = (await response.json()) as T & { error?: { code?: number; message?: string } };
    if (payload && typeof payload === "object" && "error" in payload && payload.error) {
      throw new Error(`知乎接口错误 ${payload.error.code ?? ""} ${payload.error.message ?? ""}`.trim());
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

/** 按与检索词的词面相似度排序，相似度作为 relevance_signal 展示。 */
function rank(records: ZhihuKnowledgeRecord[], query: string, limit: number): RankedRecord[] {
  return records
    .map((record) => ({
      ...record,
      relevance: similarity(
        query,
        `${record.title} ${record.chapter_name} ${record.description} ${record.labels.join(" ")}`,
      ),
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

function toResource(
  record: RankedRecord,
  input: { status: ZhihuDataStatus; fetchedAt: string; apiName: string; whyForTask: string },
): ZhihuResource {
  const sourceLabel =
    input.status === "live"
      ? "ZhihuOfficialResource"
      : input.status === "server_cache"
        ? "ZhihuCachedResource"
        : "ZhihuDemoCache";
  return {
    resource_id: `zhihu_${record.work_id}`,
    title: record.title,
    // 接口返回 description / introduction 才展示，否则标记为未返回。
    excerpt: record.introduction || record.description || null,
    author_name: record.author_name || null,
    // 知识列表与详情接口都未返回可跳转链接，因此不伪造 URL。
    url: null,
    content_type: record.chapter_name ? "知乎盐选知识内容" : null,
    authority_signal: record.author_name
      ? `知乎官方知识库收录内容，作者：${record.author_name}`
      : "知乎官方知识库收录内容（接口未返回作者）",
    relevance_signal: `与目标能力关键词的词面相关度 ${record.relevance.toFixed(3)}（平台确定性计算，非知乎返回字段）`,
    fetched_at: input.fetchedAt,
    data_status: input.status,
    api_name: input.apiName,
    why_for_task: input.whyForTask,
    source: sourceLabel,
  };
}

function buildMeta(input: {
  status: ZhihuDataStatus;
  apiName: string;
  fetchedAt: string;
  cacheKey: string;
  note: string;
}): ZhihuFetchMeta {
  return {
    data_status: input.status,
    api_name: input.apiName,
    fetched_at: input.fetchedAt,
    cache_key: input.cacheKey,
    calls_today: counters.app,
    daily_budget: serverConfig.zhihu.dailyBudget,
    breaker_open: breakerOpen(),
    note: input.note,
  };
}

function demoResult(input: ZhihuQuery, cacheKey: string, note: string, status: ZhihuDataStatus): ZhihuFetchResult {
  const limit = input.limit ?? 3;
  const ranked = rank(ZHIHU_DEMO_CACHE, input.query, limit);
  return {
    resources: ranked.map((record) =>
      toResource(record, {
        status,
        fetchedAt: DEMO_CACHE_FETCHED_AT,
        apiName: "hackathon/v2/knowledge/list + knowledge/{work_id}（快照）",
        whyForTask: input.whyForTask,
      }),
    ),
    meta: buildMeta({
      status,
      apiName: "hackathon/v2/knowledge/list + knowledge/{work_id}（快照）",
      fetchedAt: DEMO_CACHE_FETCHED_AT,
      cacheKey,
      note,
    }),
  };
}

/**
 * 主入口。调用时机由上层控制：仅在生成报告或用户点击刷新时触发。
 */
export async function fetchZhihuResources(input: ZhihuQuery): Promise<ZhihuFetchResult> {
  rollDayIfNeeded();
  const limit = input.limit ?? 3;
  const cacheKey = buildCacheKey({ taskId: input.taskId, query: input.query });

  const cached = cache.get(cacheKey);
  const cacheValid = cached && cached.expiresAt > Date.now();

  if (cacheValid && !input.forceRefresh) {
    return {
      resources: cached.records
        .slice(0, limit)
        .map((record) =>
          toResource(record, {
            status: "server_cache",
            fetchedAt: cached.fetchedAt,
            apiName: cached.apiName,
            whyForTask: input.whyForTask,
          }),
        ),
      meta: buildMeta({
        status: "server_cache",
        apiName: cached.apiName,
        fetchedAt: cached.fetchedAt,
        cacheKey,
        note: `命中服务端缓存，抓取时间 ${cached.fetchedAt}，TTL ${serverConfig.zhihu.cacheTtlSeconds}s`,
      }),
    };
  }

  if (input.forceRefresh && !serverConfig.zhihu.manualRefreshEnabled) {
    return cacheValid
      ? servedFromCache(cached, input, cacheKey, limit, "手动刷新已被配置关闭，返回服务端缓存")
      : demoResult(input, cacheKey, "手动刷新已被配置关闭且无可用缓存，使用演示缓存数据", "demo_cache");
  }

  if (breakerOpen()) {
    return cacheValid
      ? servedFromCache(cached, input, cacheKey, limit, "熔断已打开，返回服务端缓存")
      : demoResult(input, cacheKey, "熔断已打开，使用演示缓存数据", "demo_cache");
  }

  if (counters.app >= serverConfig.zhihu.dailyBudget) {
    return cacheValid
      ? servedFromCache(cached, input, cacheKey, limit, "已达每日调用预算，返回服务端缓存")
      : demoResult(
          input,
          cacheKey,
          `已达每日调用预算 ${serverConfig.zhihu.dailyBudget} 次，使用演示缓存数据`,
          "demo_cache",
        );
  }

  // 计数在真正发起请求前累加，避免失败重试绕过预算。
  counters.app += 1;
  counters.byUser[input.userId] = (counters.byUser[input.userId] ?? 0) + 1;
  counters.byTask[input.taskId] = (counters.byTask[input.taskId] ?? 0) + 1;

  const attempts = serverConfig.zhihu.maxRetries + 1;
  let lastError = "";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const live = await fetchLive(limit);
      recordSuccess();
      const fetchedAt = nowIso();
      const ranked = rank(live.records, input.query, Math.max(limit, 5));
      cache.set(cacheKey, {
        cacheKey,
        records: ranked,
        fetchedAt,
        apiName: live.apiName,
        expiresAt: Date.now() + serverConfig.zhihu.cacheTtlSeconds * 1000,
      });
      return {
        resources: ranked.slice(0, limit).map((record) =>
          toResource(record, {
            status: "live",
            fetchedAt,
            apiName: live.apiName,
            whyForTask: input.whyForTask,
          }),
        ),
        meta: buildMeta({
          status: "live",
          apiName: live.apiName,
          fetchedAt,
          cacheKey,
          note: `Live 调用成功，第 ${attempt + 1} 次尝试；今日已用 ${counters.app}/${serverConfig.zhihu.dailyBudget}`,
        }),
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  recordFailure();
  // API 失败时必须明确显示缓存来源与抓取时间。
  if (cached) {
    return servedFromCache(
      cached,
      input,
      cacheKey,
      limit,
      `Live 调用失败（${lastError}），返回服务端缓存，抓取时间 ${cached.fetchedAt}`,
    );
  }
  return demoResult(
    input,
    cacheKey,
    `Live 调用失败（${lastError}），无可用服务端缓存，使用演示缓存数据，抓取时间 ${DEMO_CACHE_FETCHED_AT}`,
    "offline_fallback",
  );
}

function servedFromCache(
  entry: CacheEntry,
  input: ZhihuQuery,
  cacheKey: string,
  limit: number,
  note: string,
): ZhihuFetchResult {
  return {
    resources: entry.records.slice(0, limit).map((record) =>
      toResource(record, {
        status: "server_cache",
        fetchedAt: entry.fetchedAt,
        apiName: entry.apiName,
        whyForTask: input.whyForTask,
      }),
    ),
    meta: buildMeta({
      status: "server_cache",
      apiName: entry.apiName,
      fetchedAt: entry.fetchedAt,
      cacheKey,
      note,
    }),
  };
}

/** 供 UI 与测试读取的调用计数快照。 */
export function zhihuCounters(): {
  day: string;
  app: number;
  daily_budget: number;
  by_user: Record<string, number>;
  by_task: Record<string, number>;
  breaker_open: boolean;
  breaker_failures: number;
  cache_entries: number;
} {
  rollDayIfNeeded();
  return {
    day: counters.day,
    app: counters.app,
    daily_budget: serverConfig.zhihu.dailyBudget,
    by_user: { ...counters.byUser },
    by_task: { ...counters.byTask },
    breaker_open: breakerOpen(),
    breaker_failures: breaker.failures,
    cache_entries: cache.size,
  };
}

/** Demo Reset 使用：清空缓存、计数与熔断状态。 */
export function resetZhihuProvider(): void {
  cache.clear();
  counters.day = today();
  counters.app = 0;
  counters.byUser = {};
  counters.byTask = {};
  breaker.failures = 0;
  breaker.openedAt = null;
}
