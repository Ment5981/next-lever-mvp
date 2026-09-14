import { NextResponse } from "next/server";
import {
  cookieName,
  cookieOptions,
  exchangeAuthorizationCode,
  fetchOAuthProfile,
  getSession,
  saveProfile,
  setSessionToken,
  validateOAuthState,
} from "@/lib/server/zhihu-oauth";
import { roleHome, setWorkspaceRole } from "@/lib/server/role-session";
import { upsertZhihuIdentity } from "@/lib/server/identity-repository";

export const dynamic = "force-dynamic";

function resultUrl(request: Request, status: "success" | "error", message?: string, role?: Parameters<typeof roleHome>[0]) {
  const url = new URL(status === "success" && role ? roleHome(role) : "/", request.url);
  url.searchParams.set("oauth", status);
  if (message) url.searchParams.set("message", message);
  return url;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stateResult = validateOAuthState(request, url.searchParams.get("state"));
  if (!stateResult.ok) return NextResponse.redirect(resultUrl(request, "error", stateResult.error));

  const code = url.searchParams.get("authorization_code") || url.searchParams.get("code");
  if (!code) return NextResponse.redirect(resultUrl(request, "error", "知乎没有返回授权码，请重试。"));

  try {
    const tokenResult = await exchangeAuthorizationCode(request, code);
    const profile = await fetchOAuthProfile(tokenResult.token);
    setSessionToken(stateResult.session, tokenResult.token, tokenResult.expiresIn);
    saveProfile(request, profile);
    stateResult.session.userId = await upsertZhihuIdentity(profile) ?? undefined;
    const intendedRole = stateResult.session.intendedRole;
    const response = NextResponse.redirect(intendedRole ? resultUrl(request, "success", undefined, intendedRole) : resultUrl(request, "success"));
    if (intendedRole) setWorkspaceRole(response, intendedRole, "oauth");
    const sessionId = request.headers.get("cookie")?.match(new RegExp(`${cookieName()}=([^;]+)`))?.[1];
    if (sessionId) response.cookies.set(cookieName(), decodeURIComponent(sessionId), cookieOptions());
    return response;
  } catch {
    const session = getSession(request);
    if (session) {
      delete session.accessToken;
      delete session.accessTokenExpiresAt;
    }
    return NextResponse.redirect(resultUrl(request, "error", "知乎登录未完成，请稍后重试。"));
  }
}
