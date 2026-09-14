import { readJson, fail } from "@/app/api/_lib/respond";
import { parseWorkspaceRole } from "@/lib/auth/roles";
import { roleHome, setWorkspaceRole } from "@/lib/server/role-session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  const payload = body && typeof body === "object" ? body as { role?: unknown; next?: unknown } : {};
  const role = parseWorkspaceRole(payload.role);
  if (!role) return fail(["请选择求职者或招聘方身份。"]);

  const requestedNext = typeof payload.next === "string" && payload.next.startsWith(`/app/${role}/`) ? payload.next : undefined;
  const redirectPath = requestedNext ?? roleHome(role);
  const response = NextResponse.json({ ok: true, data: { role, redirect: redirectPath } });
  setWorkspaceRole(response, role, "demo");
  return response;
}
