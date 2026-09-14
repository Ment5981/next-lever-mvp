import { makeId, nowIso } from "@/lib/engine/util";
import { HumanDecision, type AgentSuggestion } from "@/lib/schema/enums";
import { EmployerDecision } from "@/lib/schema/domain";
import {
  advanceApplication,
  assessmentByTask,
  findApplication,
  findTask,
  listApplications,
  saveDecision,
} from "@/lib/store/store";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Payload = z.object({
  task_id: z.string().min(1),
  decision: HumanDecision,
  reason: z.string().min(1).max(1200),
  decided_by: z.string().min(1).max(80).default("招聘方负责人"),
  override_reason: z.string().max(1200).default(""),
});

/** Agent 建议与真人决策一致时的对应关系，用于判定是否构成覆盖。 */
const ALIGNED: Record<AgentSuggestion, HumanDecision> = {
  recommend_interview: "interview_invited",
  not_recommended_yet: "not_invited",
  human_review_required: "human_review",
};

/**
 * 记录招聘方真人决策。
 *
 * 真人决策与 Agent 建议分开存储：Agent 建议留在 JobAssessment 上不被改写，
 * 这里只写 EmployerDecision，并在偏离 Agent 建议时要求填写覆盖理由。
 */
export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) {
    return fail(["决策请求格式不正确，请填写决策类型与理由"]);
  }
  const body = parsed.data;

  const task = findTask(body.task_id);
  if (!task) return fail(["A2A 任务不存在"]);
  const assessment = assessmentByTask(body.task_id);
  if (!assessment) {
    return fail(["该任务尚未产出 Agent 评估结果，无法进行真人确认"]);
  }

  const overrode = ALIGNED[assessment.suggestion] !== body.decision;
  if (overrode && !body.override_reason.trim()) {
    return fail([
      `真人决策「${body.decision}」与 Agent 建议「${assessment.suggestion}」不一致，需要填写覆盖理由`,
    ]);
  }

  const decision = EmployerDecision.parse({
    decision_id: makeId("decision"),
    task_id: body.task_id,
    job_version_id: task.job_version_id,
    decision: body.decision,
    reason: body.reason,
    overrode_agent: overrode,
    override_reason: overrode ? body.override_reason : "",
    decided_by: body.decided_by,
    decided_at: nowIso(),
    source: "EmployerConfirmedFeedback",
  });
  saveDecision(decision);

  // 申请状态只经状态机推进；已确认过的申请重复提交不再转移。
  const application = findApplication(task.application_id);
  if (application?.state === "assessed") {
    advanceApplication(application.application_id, "human_confirmed");
  }

  return ok({
    decision,
    agent_suggestion: assessment.suggestion,
    applications: listApplications(),
  });
}
