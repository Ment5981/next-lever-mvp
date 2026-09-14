import type { ProviderMode } from "@/lib/schema/enums";
import type { WorkspaceState } from "@/lib/client/types";
import { Badge, type Tone } from "./ui";

const MODE_TONE: Record<ProviderMode, Tone> = {
  live: "good",
  mock: "demo",
  fallback: "warn",
};

const MODE_TEXT: Record<ProviderMode, string> = {
  live: "Live 真实调用",
  mock: "Mock 演示数据",
  fallback: "Fallback 兜底",
};

/**
 * Provider 状态条。
 *
 * 只展示运行模式与是否已配置密钥的布尔结果，任何密钥内容都不会到前端。
 */
export function ProviderStatusStrip({ state }: { state: WorkspaceState }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {state.providers.map((provider) => (
        <Badge key={provider.name} tone={MODE_TONE[provider.mode]}>
          {provider.name}：{MODE_TEXT[provider.mode]}
          {provider.configured ? "（已配置密钥）" : "（未配置密钥）"}
        </Badge>
      ))}
      <Badge tone="accent">
        A2A {state.a2a.transport} · 协议 {state.a2a.protocol_version}
      </Badge>
      <Badge tone="neutral">Schema {state.schema_version}</Badge>
      <Badge tone={state.zhihu_counters.breaker_open ? "bad" : "neutral"}>
        知乎今日调用 {state.zhihu_counters.app}/{state.zhihu_counters.daily_budget}
        {state.zhihu_counters.breaker_open ? " · 熔断已打开" : ""}
      </Badge>
    </div>
  );
}

/** A2A 兼容边界说明。不声称完全兼容规范，展示服务端给出的原文。 */
export function A2ACompatNote({ note }: { note: string }) {
  return (
    <p className="text-xs leading-relaxed break-words text-slate-500">{note}</p>
  );
}
