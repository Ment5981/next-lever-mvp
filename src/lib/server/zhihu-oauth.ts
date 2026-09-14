import { randomBytes } from "node:crypto";
import { ZHIHU_ENDPOINTS, serverConfig } from "@/lib/config";

export type ZhihuUserProfile = {
  uid: string;
  hash_id: string;
  fullname: string;
  headline: string;
  description: string;
  avatar_path: string;
  url: string;
};

type ZhihuSession = {
  state?: string;
  stateExpiresAt?: number;
  accessToken?: string;
  accessTokenExpiresAt?: number;
  profile?: ZhihuUserProfile;
  createdAt: number;
};

const SESSION_COOKIE = "next_lever_zhihu_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const STATE_TTL_MS = 10 * 60 * 1000;
const sessionStore = new Map<string, ZhihuSession>();

function pruneSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, session] of sessionStore) {
    if (session.createdAt < cutoff) sessionStore.delete(id);
  }
}

export function cookieName() {
  return SESSION_COOKIE;
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

export function getOrCreateSession(request: Request) {
  pruneSessions();
  const currentId = readCookie(request, SESSION_COOKIE);
  if (currentId && sessionStore.has(currentId)) {
    return { id: currentId, session: sessionStore.get(currentId)! };
  }
  const id = randomBytes(24).toString("hex");
  const session: ZhihuSession = { createdAt: Date.now() };
  sessionStore.set(id, session);
  return { id, session };
}

export function getSession(request: Request): ZhihuSession | null {
  pruneSessions();
  const id = readCookie(request, SESSION_COOKIE);
  return id ? sessionStore.get(id) ?? null : null;
}

export function deleteSession(request: Request) {
  const id = readCookie(request, SESSION_COOKIE);
  if (id) sessionStore.delete(id);
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function oauthConfigured() {
  return Boolean(serverConfig.zhihu.oauthAppId && serverConfig.zhihu.oauthAppKey);
}

export function redirectUri(request: Request) {
  return (
    serverConfig.zhihu.oauthRedirectUri ||
    `${new URL(request.url).origin}/api/auth/zhihu/callback`
  );
}

export function beginOAuth(request: Request) {
  const { id, session } = getOrCreateSession(request);
  const state = randomBytes(32).toString("hex");
  session.state = state;
  session.stateExpiresAt = Date.now() + STATE_TTL_MS;
  const url = new URL(ZHIHU_ENDPOINTS.oauthAuthorize);
  url.searchParams.set("redirect_uri", redirectUri(request));
  url.searchParams.set("app_id", serverConfig.zhihu.oauthAppId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return { id, url: url.toString() };
}

export function validateOAuthState(request: Request, state: string | null) {
  const session = getSession(request);
  if (!session || !state || !session.state || session.state !== state) {
    return { ok: false as const, error: "知乎登录状态校验失败，请重新发起登录。" };
  }
  if (!session.stateExpiresAt || session.stateExpiresAt < Date.now()) {
    return { ok: false as const, error: "知乎登录已超时，请重新发起登录。" };
  }
  delete session.state;
  delete session.stateExpiresAt;
  return { ok: true as const, session };
}

export function setSessionToken(session: ZhihuSession, token: string, expiresIn: number) {
  session.accessToken = token;
  session.accessTokenExpiresAt = Date.now() + Math.max(60, expiresIn) * 1000;
}

export function sessionProfile(request: Request) {
  return getSession(request)?.profile ?? null;
}

export function sessionToken(request: Request) {
  const session = getSession(request);
  if (!session?.accessToken) return null;
  if (session.accessTokenExpiresAt && session.accessTokenExpiresAt <= Date.now()) {
    return null;
  }
  return session.accessToken;
}

export function saveProfile(request: Request, profile: ZhihuUserProfile) {
  const session = getSession(request);
  if (session) session.profile = profile;
}

export function normalizeProfile(input: unknown): ZhihuUserProfile | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const uid = data.uid ?? data.UID ?? data.id;
  const fullname = data.fullname ?? data.Fullname ?? data.name;
  if (uid === undefined || typeof fullname !== "string" || !fullname.trim()) return null;
  return {
    uid: String(uid),
    hash_id: String(data.hash_id ?? data.HashID ?? ""),
    fullname: fullname.trim(),
    headline: String(data.headline ?? data.Headline ?? ""),
    description: String(data.description ?? data.Description ?? ""),
    avatar_path: String(data.avatar_path ?? data.AvatarPath ?? data.avatar_url ?? ""),
    url: String(data.url ?? data.Url ?? ""),
  };
}

export async function exchangeAuthorizationCode(request: Request, code: string) {
  const body = new URLSearchParams({
    app_id: serverConfig.zhihu.oauthAppId,
    app_key: serverConfig.zhihu.oauthAppKey,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(request),
    code,
  });
  const response = await fetch(ZHIHU_ENDPOINTS.oauthAccessToken, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = (await response.json()) as Record<string, unknown>;
  const token = typeof payload.access_token === "string" ? payload.access_token : "";
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;
  if (!response.ok || !token) throw new Error("知乎 Token 交换失败");
  return { token, expiresIn };
}

export async function fetchOAuthProfile(token: string) {
  const response = await fetch(ZHIHU_ENDPOINTS.oauthUser, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    cache: "no-store",
  });
  const payload = (await response.json()) as Record<string, unknown>;
  const profile = normalizeProfile(payload.data ?? payload);
  if (!response.ok || !profile) throw new Error("知乎用户信息获取失败");
  return profile;
}

export function oauthSessionStatus(request: Request) {
  const session = getSession(request);
  return {
    authenticated: Boolean(session?.profile && sessionToken(request)),
    profile: session?.profile ?? null,
  };
}
