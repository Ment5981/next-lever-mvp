import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseWorkspaceRole } from "@/lib/auth/roles";

function roleForPath(pathname: string) {
  if (pathname.startsWith("/app/candidate") || pathname.startsWith("/api/candidate") || pathname === "/api/authorize" || pathname.startsWith("/api/growth") || pathname === "/api/a2a/dispatch") return "candidate" as const;
  if (pathname.startsWith("/app/employer") || pathname.startsWith("/api/employer")) return "employer" as const;
  if (pathname === "/api/state") return "any" as const;
  return null;
}

export function proxy(request: NextRequest) {
  const requiredRole = roleForPath(request.nextUrl.pathname);
  if (!requiredRole) return NextResponse.next();

  const role = parseWorkspaceRole(request.cookies.get("next_lever_role")?.value);
  if (!role) {
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ ok: false, blockers: ["请先选择工作空间身份。"] }, { status: 401 });
    const url = new URL("/onboarding/role", request.url);
    url.searchParams.set("role", requiredRole === "any" ? "candidate" : requiredRole);
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  if (requiredRole !== "any" && role !== requiredRole) {
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ ok: false, blockers: ["当前身份没有访问这个空间的权限。"] }, { status: 403 });
    const url = new URL("/onboarding/role", request.url);
    url.searchParams.set("role", requiredRole);
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/:path*"],
};

