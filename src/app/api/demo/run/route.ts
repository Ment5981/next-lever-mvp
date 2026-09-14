import { dispatchAuthorizedApplications } from "@/lib/a2a/orchestrator";
import { defaultDisclosure } from "@/lib/demo/scenario";
import { buildGrowthReport } from "@/lib/engine/growth";
import { makeId, nowIso } from "@/lib/engine/util";
import { zhihuCounters } from "@/lib/providers/zhihu";
import { EmployerDecision } from "@/lib/schema/domain";
import type { HumanDecision } from "@/lib/schema/enums";
import {
  advanceApplication,
  assessmentByTask,
  authorize,
  createApplications,
  findApplication,
  getCandidate,
  latestAuthorization,
  listApplications,
  listAssessments,
  listDecisions,
  listJobs,
  listTasks,
  publishCandidateAgent,
  resetStore,
  saveDecision,
  saveReport,
  setDisclosure,
} from "@/lib/store/store";
import { baseUrlOf, fail, ok } from "../../_lib/respond";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 预置案例的真人确认动作。
 *
 * 三个岗位的后续行动刻意不同：岗位 A 邀约面试，岗位 B 暂不邀约并指出业务验证差距，
 * 岗位 C 转人工复核并说明是证据不足而不是不具备能力。
 */
const DEMO_DECISIONS: Record<
  string,
  { decision: HumanDecision; reason: string; decided_by: string }
> = {
  jv_job_a_v1: {
    decision: "interview_invited",
    reason:
      "用户研究到产品闭环这条主线有可核验的过程证据，访谈样本量与需求裁剪的取舍讲得清楚，安排一轮面试确认落地细节。",
    decided_by: "启明智研 · 产品负责人",
  },
  jv_job_b_v1: {
    decision: "not_invited",
    reason:
      "本岗位要求能对企业客户交付结果做量化归因，候选人自己确认过没有企业客户需求梳理经历，也没有除讲解完成率以外的业务指标，本轮暂不邀约。缺口在业务验证证据，不代表产品能力不足。",
    decided_by: "远景数科 · 交付负责人",
  },
  jv_job_c_v1: {
    decision: "human_review",
    reason:
      "硬性要求是可运行作品，候选人的校园项目已下线且没有可访问链接，现有材料无法验证这一项，属于证据不足而非不具备能力，转人工复核并请补充可运行的产出。",
    decided_by: "拾光实验室 · 技术合伙人",
  },
};

/**
 * 观看完整 Demo：从预置状态一次性跑完主流程。
 *
 * 顺序与真实用户路径一致，且每一步都过同一套门禁：
 * 确认披露范围 -> 生成求职者 Agent -> 一次性授权 3 个岗位 -> 创建申请
 * -> A2A 投递与追问 -> 招聘方真人确认 -> 生成成长报告（此时才调用知乎）。
 */
export async function POST(request: Request) {
  const steps: { step: string; detail: string }[] = [];

  // 从干净的预置状态开始，避免重复点击产生叠加的授权与任务。
  resetStore();
  steps.push({ step: "reset", detail: "回到预置演示状态" });

  setDisclosure(defaultDisclosure(), true);
  steps.push({ step: "disclosure", detail: "求职者逐项确认披露范围" });

  const agent = publishCandidateAgent();
  if (!agent.ok || !agent.agent) return fail(agent.blockers);
  steps.push({
    step: "candidate_agent",
    detail: `生成可投递 Agent ${agent.agent.candidate_agent_id}`,
  });

  const jobIds = listJobs().map((j) => j.job_version_id);
  const auth = authorize(jobIds);
  if (!auth.ok || !auth.authorization) return fail(auth.blockers);
  steps.push({
    step: "authorize",
    detail: `用户一次性授权 ${auth.authorization.job_count} 个岗位`,
  });

  const batch = createApplications(auth.authorization.authorization_id);
  if (!batch.ok || !batch.batch) return fail(batch.blockers);
  steps.push({
    step: "applications",
    detail: `按授权范围创建 ${batch.batch.application_ids.length} 份申请`,
  });

  const dispatched = await dispatchAuthorizedApplications({
    baseUrl: baseUrlOf(request),
  });
  if (!dispatched.ok) return fail(dispatched.blockers);
  steps.push({
    step: "a2a",
    detail: `完成 ${dispatched.results.length} 个 A2A 任务，追问轮次合计 ${dispatched.results.reduce(
      (sum, r) => sum + r.clarificationRounds,
      0,
    )}`,
  });

  // 真人确认与 Agent 建议分开存储，Agent 建议不会被这一步改写。
  for (const task of listTasks()) {
    const preset = DEMO_DECISIONS[task.job_version_id];
    const assessment = assessmentByTask(task.task_id);
    if (!preset || !assessment) continue;
    saveDecision(
      EmployerDecision.parse({
        decision_id: makeId("decision"),
        task_id: task.task_id,
        job_version_id: task.job_version_id,
        decision: preset.decision,
        reason: preset.reason,
        overrode_agent: false,
        override_reason: "",
        decided_by: preset.decided_by,
        decided_at: nowIso(),
        source: "EmployerConfirmedFeedback",
      }),
    );
    const application = findApplication(task.application_id);
    if (application?.state === "assessed") {
      advanceApplication(application.application_id, "human_confirmed");
    }
  }
  steps.push({
    step: "human_confirm",
    detail: `${listDecisions().length} 个岗位完成真人确认`,
  });

  const report = await buildGrowthReport({
    candidateAgentId: agent.agent.candidate_agent_id,
    jobs: listJobs(),
    assessments: listAssessments(),
    decisions: listDecisions(),
    applications: listApplications(),
    authorizedCount: latestAuthorization()?.job_count ?? jobIds.length,
    userId: getCandidate().candidate_id,
  });
  if (!report.ok || !report.report) return fail(report.blockers);
  const saved = saveReport(report.report);
  steps.push({
    step: "growth_report",
    detail: `成长报告 ${saved.report_id}，产出 ${saved.growth_tasks.length} 项成长任务`,
  });

  return ok({
    steps,
    report_id: saved.report_id,
    tasks: listTasks().map((t) => ({
      task_id: t.task_id,
      job_version_id: t.job_version_id,
      state: t.state,
      messages: t.messages.length,
      artifacts: t.artifacts.length,
      clarification_rounds: t.clarification_rounds,
    })),
    zhihu_counters: zhihuCounters(),
    blockers: dispatched.blockers,
  });
}
