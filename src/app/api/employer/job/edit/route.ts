import { nowIso } from "@/lib/engine/util";
import { JobVersion } from "@/lib/schema/domain";
import { appendJobVersion, findJob, setJobPublished } from "@/lib/store/store";
import { fail, ok, readJson } from "../../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  job_version_id: z.string().min(1),
  title: z.string().min(1).max(80),
  summary: z.string().min(1).max(1200),
});

/** 编辑岗位 Agent 追加新版本，保留旧版本并把新版本作为当前发布版本。 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["岗位 Agent 的标题和核心描述不能为空"]);
  const current = findJob(parsed.data.job_version_id);
  if (!current) return fail(["岗位版本不存在"]);
  const next = JobVersion.parse({
    ...current,
    job_version_id: `${current.job_id}_v0`,
    version: 1,
    title: parsed.data.title,
    summary: parsed.data.summary,
    confirmed: true,
    confirmed_at: nowIso(),
    created_at: nowIso(),
  });
  const stored = appendJobVersion(next);
  if (current.published) setJobPublished(current.job_version_id, false);
  return ok({ job: stored, note: `已保存为岗位 Agent 新版本 v${stored.version}` });
}
