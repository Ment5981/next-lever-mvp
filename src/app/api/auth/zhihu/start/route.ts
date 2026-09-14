import { NextResponse } from "next/server";
import {
  beginOAuth,
  cookieName,
  cookieOptions,
  oauthConfigured,
} from "@/lib/server/zhihu-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!oauthConfigured()) {
    return NextResponse.json(
      { ok: false, blockers: ["尚未配置知乎 OAuth App ID / App Key。"] },
      { status: 503 },
    );
  }
  const { id, url } = beginOAuth(request);
  const response = NextResponse.redirect(url);
  response.cookies.set(cookieName(), id, cookieOptions());
  return response;
}
