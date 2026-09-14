import { NextResponse } from "next/server";

/** 统一的成功响应。 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

/**
 * 统一的失败响应。blockers 是给用户看的门禁原因，
 * 不包含任何密钥、完整简历或内部堆栈。
 */
export function fail(blockers: string[], status = 400) {
  return NextResponse.json({ ok: false, blockers }, { status });
}

/** 解析请求体。非法 JSON 不抛栈，直接归一成门禁错误。 */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** 从请求推导 baseUrl，用于生成 Agent Card 里的接口地址。 */
export function baseUrlOf(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}
