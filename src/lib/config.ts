import type { ProviderMode } from "@/lib/schema/enums";

function intFromEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function present(key: string): boolean {
  return typeof process.env[key] === "string" && process.env[key]!.trim().length > 0;
}

/**
 * 服务端配置。只在服务端读取，且只向外暴露布尔值与数值，
 * 不会把密钥本身放进返回结构、日志或提示词。
 */
export const serverConfig = {
  llm: {
    get configured(): boolean {
      return present("LLM_API_KEY") && present("LLM_BASE_URL");
    },
    get baseUrl(): string {
      return process.env.LLM_BASE_URL?.trim() ?? "";
    },
    get model(): string {
      return process.env.LLM_MODEL?.trim() || "gpt-4o-mini";
    },
    get apiKey(): string {
      return process.env.LLM_API_KEY?.trim() ?? "";
    },
    get timeoutMs(): number {
      return intFromEnv("LLM_REQUEST_TIMEOUT_MS", 20000);
    },
    get maxRetries(): number {
      return intFromEnv("LLM_MAX_RETRIES", 1);
    },
  },
  zhihu: {
    /** zhihu_search 需要 Access Secret；知识列表接口无需鉴权。 */
    get searchConfigured(): boolean {
      return present("ZHIHU_ACCESS_SECRET");
    },
    get accessSecret(): string {
      return process.env.ZHIHU_ACCESS_SECRET?.trim() ?? "";
    },
    get oauthAppId(): string {
      return (
        process.env.ZHIHU_OAUTH_APP_ID?.trim() ||
        process.env.ZHIHU_OAUTH_CLIENT_ID?.trim() ||
        ""
      );
    },
    get oauthAppKey(): string {
      return (
        process.env.ZHIHU_OAUTH_APP_KEY?.trim() ||
        process.env.ZHIHU_OAUTH_CLIENT_SECRET?.trim() ||
        ""
      );
    },
    get oauthRedirectUri(): string {
      return process.env.ZHIHU_OAUTH_REDIRECT_URI?.trim() || "";
    },
    get appConfigured(): boolean {
      return present("ZHIHU_APP_ID") && present("ZHIHU_APP_KEY");
    },
    get oauthConfigured(): boolean {
      return present("ZHIHU_OAUTH_CLIENT_ID") && present("ZHIHU_OAUTH_CLIENT_SECRET");
    },
    get dailyBudget(): number {
      return intFromEnv("ZHIHU_DAILY_BUDGET", 3);
    },
    get cacheTtlSeconds(): number {
      return intFromEnv("ZHIHU_CACHE_TTL_SECONDS", 86400);
    },
    get timeoutMs(): number {
      return intFromEnv("ZHIHU_REQUEST_TIMEOUT_MS", 8000);
    },
    get maxRetries(): number {
      return Math.min(1, intFromEnv("ZHIHU_MAX_RETRIES", 1));
    },
    get breakerThreshold(): number {
      return intFromEnv("ZHIHU_CIRCUIT_BREAKER_FAILURES", 3);
    },
    get manualRefreshEnabled(): boolean {
      return (process.env.ZHIHU_MANUAL_REFRESH_ENABLED ?? "true") !== "false";
    },
  },
  a2a: {
    get transport(): string {
      return process.env.A2A_TRANSPORT?.trim() || "in-process-jsonrpc";
    },
  },
} as const;

export const ZHIHU_ENDPOINTS = {
  /** 无需鉴权，比赛提供的知识列表能力。 */
  knowledgeList:
    "https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge/list",
  /**
   * 无需鉴权的知识详情。
   * 实测（2026-09-14）有效路径是 /v2/knowledge/{work_id}；
   * 文档中出现过的 /v2/story/{work_id} 目前对全部 work_id 返回 40404 Work Not Found，
   * 因此以实际响应为准，并保留 storyDetailLegacy 便于对照排查。
   */
  knowledgeDetail: "https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge",
  storyDetailLegacy: "https://api.zhihu.com/km-indep-home/hackathon/v2/story",
  /** 需要 Access Secret。 */
  search: "https://developer.zhihu.com/api/v1/content/zhihu_search",
  hotList: "https://developer.zhihu.com/api/v1/content/hot_list",
  oauthAuthorize: "https://openapi.zhihu.com/authorize",
  oauthAccessToken: "https://openapi.zhihu.com/access_token",
  oauthUser: "https://openapi.zhihu.com/user",
  userContents: "https://developer.zhihu.com/api/v1/user/contents",
  userFollowees: "https://developer.zhihu.com/api/v1/user/followees",
  quota: "https://developer.zhihu.com/api/v1/quota",
} as const;

export const SCHEMA_VERSION = "v0.3.0";

export function llmMode(): ProviderMode {
  return serverConfig.llm.configured ? "live" : "mock";
}
