import { makeId, sanitizeUntrusted } from "@/lib/engine/util";
import { extractEvidence } from "@/lib/providers/llm";
import type { Evidence } from "@/lib/schema/domain";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  resume_text: z.string().max(20000).default(""),
  project_text: z.string().max(20000).default(""),
});

/**
 * 从材料中提取事实草稿。
 *
 * 只返回草稿，不写入档案：每条事实都必须由求职者改过、确认过或删除过，
 * 再经 /api/candidate/materials 落库。提取结果保留原文引用片段用于核对。
 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["材料格式不正确"]);

  // 简历与项目材料都是不可信输入，先清洗再进提示词。
  const resumeText = sanitizeUntrusted(parsed.data.resume_text, 20000);
  const projectText = sanitizeUntrusted(parsed.data.project_text, 20000);
  if (!resumeText.trim() && !projectText.trim()) {
    return fail(["请先粘贴简历文本或项目材料"]);
  }

  const result = await extractEvidence({ resumeText, projectText });
  const evidence: Evidence[] = result.data.facts.map((fact) => ({
    evidence_id: makeId("ev"),
    claim: fact.claim,
    quote: fact.quote,
    material_ref: fact.material_ref,
    level: fact.level,
    // 提取出来的都还只是自述，确认后才升为已确认事实。
    source: "CandidateClaim" as const,
    confirmed: false,
    edited_by_user: false,
  }));

  return ok({ evidence, provider: result.meta });
}
