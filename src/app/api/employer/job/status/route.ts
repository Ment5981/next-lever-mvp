import { fail, ok, readJson } from "../../../_lib/respond";
import { findJob, setJobHiringStatus } from "@/lib/store/store";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  job_version_id: z.string().min(1),
  hiring_status: z.enum(["hiring", "filled"]),
});

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["招聘状态不正确"]);
  const job = findJob(parsed.data.job_version_id);
  if (!job) return fail(["岗位版本不存在"]);
  const updated = setJobHiringStatus(parsed.data.job_version_id, parsed.data.hiring_status);
  if (!updated) return fail(["招聘状态更新失败"]);
  return ok({ job: updated });
}
