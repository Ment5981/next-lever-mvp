import { SCHEMA_VERSION, serverConfig } from "@/lib/config";
import { A2A_COMPAT_NOTE, PROTOCOL_VERSION } from "@/lib/a2a/protocol";
import { llmStatus } from "@/lib/providers/llm";
import { zhihuCounters, zhihuStatus } from "@/lib/providers/zhihu";
import { ok } from "../../_lib/respond";

export const dynamic = "force-dynamic";

/**
 * Provider 状态。只暴露模式、是否已配置与数值参数，
 * 绝不返回密钥内容本身。
 */
export async function GET() {
  return ok({
    schema_version: SCHEMA_VERSION,
    providers: [llmStatus(), zhihuStatus()],
    a2a: {
      transport: serverConfig.a2a.transport,
      protocol_version: PROTOCOL_VERSION,
      compat_note: A2A_COMPAT_NOTE,
    },
    zhihu_counters: zhihuCounters(),
  });
}
