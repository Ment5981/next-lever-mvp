import type { ProviderMode } from "@/lib/schema/enums";

export type ProviderStatus = {
  name: string;
  mode: ProviderMode;
  detail: string;
  /** 是否配置了密钥。只返回布尔值，绝不返回密钥内容。 */
  configured: boolean;
};

export type ProviderCallMeta = {
  mode: ProviderMode;
  attempts: number;
  fell_back: boolean;
  note: string;
};

export function demoNote(text: string): string {
  return `演示数据：${text}`;
}
