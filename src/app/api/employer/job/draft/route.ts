import { makeId, nowIso, sanitizeUntrusted } from "@/lib/engine/util";
import { structureJob } from "@/lib/providers/llm";
import { fail, ok, readJson } from "../../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  company_name: z.string().min(1).max(80),
  company_profile_url: z.string().url().max(500).or(z.literal("")).default(""),
  attachments: z
    .array(
      z.object({
        file_name: z.string().min(1).max(180),
        mime_type: z.string().min(1).max(120),
        size_bytes: z.number().int().nonnegative().max(20 * 1024 * 1024),
      }),
    )
    .max(6)
    .default([]),
  raw_text: z.string().min(10).max(8000),
  input_mode: z.enum(["text", "voice"]).default("text"),
  /** 语音输入必须先确认转写，未确认不能进入岗位模型。 */
  transcript_confirmed: z.boolean().default(false),
});

/**
 * 岗位结构化草稿：生成追问与可编辑能力模型。
 * 这里不写入任何岗位版本，招聘方确认后才落库。
 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) {
    return fail(["岗位描述至少需要 10 个字符，并填写公司名称"]);
  }
  const body = parsed.data;
  if (body.input_mode === "voice" && !body.transcript_confirmed) {
    return fail(["语音转写结果尚未确认，未确认的转写不能进入岗位模型"]);
  }

  // 岗位原文是不可信输入，提示词里已做包裹，这里再做一次清洗。
  const rawText = sanitizeUntrusted(body.raw_text, 8000);
  const result = await structureJob({
    rawText,
    companyName: body.company_name,
    companyProfileUrl: body.company_profile_url,
    attachments: body.attachments,
  });

  const jobId = makeId("job");
  return ok({
    draft: {
      job_id: jobId,
      company_name: body.company_name,
      company_profile_url: body.company_profile_url,
      attachments: body.attachments,
      title: result.data.title,
      summary: result.data.summary,
      raw_input: rawText,
      input_mode: body.input_mode,
      transcript_confirmed: body.transcript_confirmed,
      created_at: nowIso(),
      clarifications: result.data.clarifying_questions.map((q) => ({
        question_id: makeId("q"),
        question: q.question,
        why_it_matters: q.why_it_matters,
        answer: null,
      })),
      criteria: result.data.criteria.map((c) => ({
        ...c,
        criterion_id: makeId("crit"),
        source: "JobRequirement" as const,
      })),
    },
    provider: result.meta,
  });
}
