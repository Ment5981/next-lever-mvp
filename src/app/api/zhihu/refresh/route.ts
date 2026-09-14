import { serverConfig } from "@/lib/config";
import { makeId } from "@/lib/engine/util";
import { fetchZhihuResources, zhihuCounters } from "@/lib/providers/zhihu";
import { getCandidate, latestReport, saveReport } from "@/lib/store/store";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({ task_id: z.string().min(1) });

/**
 * 用户主动刷新某项成长任务的知乎资源。
 *
 * 手动刷新绕过服务端缓存，但仍受每日预算、超时、单次重试与熔断约束；
 * 失败时保留原有缓存内容并标明来源与获取时间，不会清空已展示的资源。
 */
export async function POST(request: Request) {
  if (!serverConfig.zhihu.manualRefreshEnabled) {
    return fail(["手动刷新已在服务端关闭"]);
  }
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["刷新请求缺少成长任务 id"]);

  const report = latestReport();
  if (!report) return fail(["尚未生成成长报告"]);
  const task = report.growth_tasks.find((t) => t.task_id === parsed.data.task_id);
  if (!task) return fail(["成长任务不存在"]);

  const result = await fetchZhihuResources({
    taskId: task.task_id,
    query: task.target_capability,
    whyForTask: `围绕「${task.target_capability}」的学习内容，用于支撑本任务的产出：${task.deliverable}`,
    userId: getCandidate().candidate_id,
    limit: 3,
    forceRefresh: true,
  });

  // 报告是不可变快照：刷新写入新版本，旧版本保留可追溯。
  const updated = saveReport({
    ...report,
    report_id: makeId("report"),
    growth_tasks: report.growth_tasks.map((t) =>
      t.task_id === task.task_id
        ? { ...t, zhihu_resources: result.resources, zhihu_meta: result.meta }
        : t,
    ),
  });

  return ok({
    report: updated,
    meta: result.meta,
    zhihu_counters: zhihuCounters(),
  });
}
