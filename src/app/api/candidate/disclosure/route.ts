import { DisclosureScope } from "@/lib/schema/domain";
import { getDisclosure, setDisclosure } from "@/lib/store/store";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  scope: DisclosureScope,
  confirmed: z.boolean().default(false),
});

/** 逐项设置披露范围。确认前不生成 Agent，确认后不得静默扩大。 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["披露范围格式不正确"]);
  setDisclosure(parsed.data.scope, parsed.data.confirmed);
  const current = getDisclosure();
  return ok({ disclosure: current.scope, disclosure_confirmed: current.confirmed });
}
