import type {
  Application,
  CandidateAgent,
  CandidateProfile,
  DisclosureScope,
  InterviewSession,
  JobVersion,
} from "@/lib/schema/domain";
import { validateWeights } from "./scoring";

export type GateResult = { ok: boolean; blockers: string[] };

function gate(blockers: string[]): GateResult {
  return { ok: blockers.length === 0, blockers };
}

/** 岗位版本能否确认：需要转写确认（语音输入）+ 权重合计 100% + 每项有证据标准。 */
export function canConfirmJobVersion(job: JobVersion): GateResult {
  const blockers: string[] = [];
  if (job.input_mode === "voice" && !job.transcript_confirmed) {
    blockers.push("语音转写结果尚未确认，未确认的转写不能进入岗位模型");
  }
  const weights = validateWeights(job.criteria);
  if (!weights.ok) blockers.push(weights.message);
  if (job.criteria.length === 0) blockers.push("至少需要一项能力要求");
  for (const c of job.criteria) {
    if (!c.evidence_standard.trim()) {
      blockers.push(`能力「${c.name}」缺少证据标准`);
    }
    if (c.evaluation_questions.length === 0) {
      blockers.push(`能力「${c.name}」缺少评估问题`);
    }
  }
  return gate(blockers);
}

/** 求职者材料确认门槛：至少一条已确认证据。 */
export function canConfirmMaterials(profile: CandidateProfile): GateResult {
  const blockers: string[] = [];
  const confirmed = profile.evidence.filter((e) => e.confirmed);
  if (confirmed.length === 0) {
    blockers.push("至少需要确认一条事实证据");
  }
  if (!profile.resume_text.trim() && !profile.project_text.trim()) {
    blockers.push("需要提供简历文本或项目材料");
  }
  return gate(blockers);
}

/** 模拟面试完成门槛：语音回答必须先确认转写，摘要必须由用户确认。 */
export function canCompleteInterview(session: InterviewSession): GateResult {
  const blockers: string[] = [];
  const answered = session.turns.filter((t) => t.raw_answer.trim().length > 0);
  if (answered.length < 3) {
    blockers.push(`至少需要回答 3 个模拟面试问题，当前 ${answered.length} 个`);
  }
  for (const turn of answered) {
    if (turn.answer_mode === "voice" && !turn.transcript_confirmed) {
      blockers.push("语音回答的转写结果需要先确认或修正");
    }
    if (!turn.summary_confirmed) {
      blockers.push("回答摘要需要求职者确认后才能进入 Agent");
    }
  }
  return gate(blockers);
}

/** 生成可投递 Agent 的门槛：材料 + 面试 + 披露范围三项都确认。 */
export function canPublishCandidateAgent(input: {
  profile: CandidateProfile;
  session: InterviewSession;
  disclosure: DisclosureScope;
  disclosureConfirmed: boolean;
}): GateResult {
  const blockers: string[] = [];
  const materials = canConfirmMaterials(input.profile);
  if (!input.profile.materials_confirmed) {
    blockers.push("求职者尚未确认材料");
    blockers.push(...materials.blockers);
  }
  if (!input.session.completed) {
    blockers.push("模拟面试尚未完成确认");
  }
  if (!input.disclosureConfirmed) {
    blockers.push("披露范围尚未确认");
  }
  if (
    input.disclosure.evidence_ids.length === 0 &&
    input.disclosure.interview_turn_ids.length === 0
  ) {
    blockers.push("披露范围为空，Agent 没有任何可共享内容");
  }
  return gate(blockers);
}

/** 授权门槛：必须有可投递 Agent，且一次性明确岗位数量。 */
export function canAuthorize(input: {
  agent: CandidateAgent | null;
  selectedJobVersionIds: string[];
}): GateResult {
  const blockers: string[] = [];
  if (!input.agent) blockers.push("尚未生成可投递的求职者 Agent");
  if (!input.agent?.disclosure_confirmed) blockers.push("披露范围尚未确认");
  if (input.selectedJobVersionIds.length === 0) blockers.push("至少需要选择一个岗位");
  return gate(blockers);
}

/** 发送申请门槛：必须存在授权记录，且岗位在授权范围内。 */
export function canDispatch(input: {
  application: Application;
  authorizedJobVersionIds: string[] | null;
}): GateResult {
  const blockers: string[] = [];
  if (!input.authorizedJobVersionIds) {
    blockers.push("未授权不得创建或发送申请");
    return gate(blockers);
  }
  if (!input.authorizedJobVersionIds.includes(input.application.job_version_id)) {
    blockers.push("该岗位不在用户一次性授权范围内，不能静默新增岗位");
  }
  if (input.application.state !== "authorized") {
    blockers.push(`申请状态为 ${input.application.state}，只有 authorized 可以发送`);
  }
  return gate(blockers);
}

/** 披露范围不得在授权后扩大。 */
export function disclosureNotExpanded(
  snapshot: DisclosureScope,
  current: DisclosureScope,
): GateResult {
  const blockers: string[] = [];
  const check = (
    key: "evidence_ids" | "portfolio_item_ids" | "interview_turn_ids",
    label: string,
  ) => {
    const allowed = new Set(snapshot[key]);
    const added = current[key].filter((id) => !allowed.has(id));
    if (added.length > 0) {
      blockers.push(`${label} 超出已授权范围（新增 ${added.length} 项），需要重新授权`);
    }
  };
  check("evidence_ids", "事实证据");
  check("portfolio_item_ids", "作品链接");
  check("interview_turn_ids", "面试回答");
  return gate(blockers);
}
