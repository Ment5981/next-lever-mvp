import { resetStore } from "@/lib/store/store";
import { ok } from "../_lib/respond";

export const dynamic = "force-dynamic";

/** Reset：回到预置演示状态，同时清空知乎缓存与当日调用计数。 */
export async function POST() {
  resetStore();
  return ok({ reset: true, note: "已回到预置演示状态，知乎缓存与调用计数已清空" });
}
