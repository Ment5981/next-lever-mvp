import { NextResponse } from "next/server";
import { cookieName, deleteSession } from "@/lib/server/zhihu-oauth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  deleteSession(request);
  const response = NextResponse.json({ ok: true, data: { logged_out: true } });
  response.cookies.delete(cookieName());
  return response;
}
