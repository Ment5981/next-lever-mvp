import { authorize, createApplications } from "@/lib/store/store";
import { fail, ok, readJson } from "../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  job_version_ids: z.array(z.string().min(1)).min(1).max(20),
  /** 前端展示的岗位数量，用于确认用户看到的数量与实际授权一致。 */
  acknowledged_job_count: z.number().int().positive(),
});

/**
 * 一次性批量授权，并按授权范围创建申请。
 *
 * 授权数量必须与界面上明示给用户的数量一致，
 * 防止在用户确认之后静默新增岗位。
 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["授权请求格式不正确，请重新选择岗位"]);
  const body = parsed.data;

  const unique = [...new Set(body.job_version_ids)];
  if (unique.length !== body.acknowledged_job_count) {
    return fail([
      `界面确认的岗位数量为 ${body.acknowledged_job_count}，实际提交 ${unique.length} 个，已拒绝本次授权`,
    ]);
  }

  const result = authorize(unique);
  if (!result.ok || !result.authorization) return fail(result.blockers);

  const batch = createApplications(result.authorization.authorization_id);
  if (!batch.ok || !batch.batch) return fail(batch.blockers);

  return ok({
    authorization: result.authorization,
    batch: batch.batch,
    note: `已授权 ${result.authorization.job_count} 个岗位，披露范围已冻结快照`,
  });
}
