import { polishResume } from "@/lib/providers/llm";
import { sanitizeUntrusted } from "@/lib/engine/util";
import { fail, ok, readJson } from "../../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  target_role: z.string().max(120).default(""),
  source_text: z.string().min(1).max(20000),
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["简历润色请求格式不正确"]);
  const sourceText = sanitizeUntrusted(parsed.data.source_text, 20000);
  if (!sourceText.trim()) return fail(["请先输入一段简历或项目经历"]);
  const result = await polishResume({
    targetRole: sanitizeUntrusted(parsed.data.target_role, 120),
    sourceText,
  });
  return ok({ result: result.data, provider: result.meta });
}
