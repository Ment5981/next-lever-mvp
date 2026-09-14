import { fail, ok, readJson } from "../../../_lib/respond";
import { findJob, setJobPublished } from "@/lib/store/store";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  job_version_id: z.string().min(1),
  published: z.boolean().default(true),
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["岗位发布信息不正确"]);
  const job = findJob(parsed.data.job_version_id);
  if (!job) return fail(["岗位版本不存在"]);
  if (!job.confirmed) return fail(["岗位版本尚未确认，不能发布"]);
  const updated = setJobPublished(parsed.data.job_version_id, parsed.data.published);
  if (!updated) return fail(["岗位发布状态更新失败"]);
  return ok({ job: updated });
}
