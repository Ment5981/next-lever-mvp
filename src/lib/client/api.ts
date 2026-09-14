import type { ApiResult } from "./types";

/**
 * 统一的接口调用封装。
 *
 * 服务端所有路由都返回 `{ok:true,data}` 或 `{ok:false,blockers[]}`，
 * 这里把网络异常也归一成同一形状的门禁错误，页面只需处理一种结果。
 */
export async function callApi<T>(
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const payload: unknown = await response.json().catch(() => null);
    if (payload && typeof payload === "object" && "ok" in payload) {
      return payload as ApiResult<T>;
    }
    return { ok: false, blockers: [`接口 ${path} 返回了无法解析的响应`] };
  } catch {
    // Demo 不因网络或模型失败中断：调用方拿到 blockers 后继续用现有快照渲染。
    return { ok: false, blockers: [`无法连接 ${path}，请稍后重试`] };
  }
}

export function blockersOf<T>(result: ApiResult<T>): string[] {
  return result.ok ? [] : result.blockers;
}
