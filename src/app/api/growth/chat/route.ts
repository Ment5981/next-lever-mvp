import { answerGrowthCoach } from "@/lib/providers/llm";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  question: z.string().min(1).max(1000),
  context: z.string().max(5000).default(""),
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["请输入想咨询的成长问题"]);
  const result = await answerGrowthCoach(parsed.data);
  return ok({ ...result.data, provider: result.meta });
}
