import type { z } from "zod";

export type ValidationOutcome<T> =
  | { ok: true; data: T; attempts: number; repaired: boolean }
  | { ok: false; error: string; attempts: number };

/**
 * Schema 校验最多重试一次，然后交给调用方进入人工复核或 Demo Fallback。
 * PRD §工程边界要求：不允许无限重试，也不允许自由文本直接改状态。
 */
export async function validateWithRetry<T>(
  schema: z.ZodType<T>,
  produce: (attempt: number, lastError: string | null) => Promise<unknown>,
  maxRetries = 1,
): Promise<ValidationOutcome<T>> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let raw: unknown;
    try {
      raw = await produce(attempt, lastError);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
    const parsed = schema.safeParse(raw);
    if (parsed.success) {
      return {
        ok: true,
        data: parsed.data,
        attempts: attempt + 1,
        repaired: attempt > 0,
      };
    }
    lastError = formatIssues(parsed.error);
  }
  return {
    ok: false,
    error: lastError ?? "unknown validation failure",
    attempts: maxRetries + 1,
  };
}

export function formatIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} schema 校验失败: ${formatIssues(parsed.error)}`);
  }
  return parsed.data;
}
