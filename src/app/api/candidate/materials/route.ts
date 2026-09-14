import { canConfirmMaterials } from "@/lib/engine/gates";
import { Evidence, PortfolioItem } from "@/lib/schema/domain";
import { getCandidate, updateCandidate } from "@/lib/store/store";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  resume_text: z.string().max(20000).optional(),
  project_text: z.string().max(20000).optional(),
  portfolio: z.array(PortfolioItem).max(20).optional(),
  evidence: z.array(Evidence).max(40).optional(),
  materials_confirmed: z.boolean().optional(),
});

/**
 * 保存并确认求职者材料。
 *
 * 事实提取结果必须由用户改过、确认过或删除过才写回；
 * 这里只接受前端传回的最终条目，服务端不再自行补充事实。
 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) {
    return fail(["材料提交格式不正确，请检查证据条目与作品链接字段"]);
  }
  const body = parsed.data;

  const current = getCandidate();
  const next = {
    ...current,
    ...(body.resume_text !== undefined ? { resume_text: body.resume_text } : {}),
    ...(body.project_text !== undefined ? { project_text: body.project_text } : {}),
    ...(body.portfolio !== undefined ? { portfolio: body.portfolio } : {}),
    ...(body.evidence !== undefined ? { evidence: body.evidence } : {}),
  };

  // 只有确认动作需要过门禁；仅保存草稿时允许证据尚未确认。
  if (body.materials_confirmed) {
    const gate = canConfirmMaterials(next);
    if (!gate.ok) return fail(gate.blockers);
  }

  const saved = updateCandidate({
    ...next,
    materials_confirmed: body.materials_confirmed ?? current.materials_confirmed,
  });
  return ok({ candidate: saved });
}
