import { canConfirmJobVersion } from "@/lib/engine/gates";
import { nowIso } from "@/lib/engine/util";
import { JobVersion } from "@/lib/schema/domain";
import { appendJobVersion } from "@/lib/store/store";
import { fail, ok, readJson } from "../../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

/** 版本号与 job_version_id 由服务端分配，前端传入的值不作数。 */
const Payload = JobVersion.omit({
  job_version_id: true,
  version: true,
  confirmed: true,
  confirmed_at: true,
}).extend({
  job_id: z.string().min(1),
});

/**
 * 招聘方确认岗位版本。
 *
 * 权重合计必须为 100%，语音转写必须已确认，每项能力必须有证据标准与评估问题。
 * 已确认版本不可静默覆盖：同一 job_id 再次确认只会追加 version+1 的新记录。
 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) {
    return fail([
      "岗位提交格式不正确，请检查能力项的描述、证据标准与评估问题是否完整",
    ]);
  }

  const candidate = JobVersion.parse({
    ...parsed.data,
    // 占位值，appendJobVersion 会按 job_id 重新分配真实版本号。
    job_version_id: `${parsed.data.job_id}_v0`,
    version: 1,
    confirmed: true,
    confirmed_at: nowIso(),
  });

  const gate = canConfirmJobVersion(candidate);
  if (!gate.ok) return fail(gate.blockers);

  const stored = appendJobVersion(candidate);
  return ok({
    job: stored,
    note: `已生成岗位版本 ${stored.job_version_id}，旧版本保留不被覆盖`,
  });
}
