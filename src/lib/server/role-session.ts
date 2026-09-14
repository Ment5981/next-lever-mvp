import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { parseWorkspaceRole, type WorkspaceRole } from "@/lib/auth/roles";

export const ROLE_COOKIE = "next_lever_role";
export const ROLE_MODE_COOKIE = "next_lever_role_mode";

const roleCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function selectedWorkspaceRole() {
  const cookieStore = await cookies();
  return parseWorkspaceRole(cookieStore.get(ROLE_COOKIE)?.value);
}

export function roleFromRequest(request: Request) {
  const value = request.headers.get("cookie")?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${ROLE_COOKIE}=`))?.slice(ROLE_COOKIE.length + 1);
  return parseWorkspaceRole(value ? decodeURIComponent(value) : null);
}

export function setWorkspaceRole(response: NextResponse, role: WorkspaceRole, mode: "demo" | "oauth" = "demo") {
  response.cookies.set(ROLE_COOKIE, role, roleCookieOptions);
  response.cookies.set(ROLE_MODE_COOKIE, mode, roleCookieOptions);
  return response;
}

export function roleHome(role: WorkspaceRole) {
  return `/app/${role}`;
}

