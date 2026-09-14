import { workspaceSnapshot } from "@/lib/server/snapshot";
import { ok } from "../_lib/respond";

export const dynamic = "force-dynamic";

/**
 * 工作台快照。页面只读这一个接口拿全量状态，
 * 避免在切页时重复触发任何外部 Provider 调用。
 */
export async function GET() {
  return ok(workspaceSnapshot());
}
