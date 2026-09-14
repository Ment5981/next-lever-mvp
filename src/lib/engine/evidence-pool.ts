import type { Evidence, InterviewSession, CandidateProfile } from "@/lib/schema/domain";
import type { EvidenceLevel } from "@/lib/schema/enums";

export const ANSWER_EVIDENCE_PREFIX = "ans_";

export function answerEvidenceId(turnId: string): string {
  return `${ANSWER_EVIDENCE_PREFIX}${turnId}`;
}

/**
 * 把已确认的面试回答摘要转成证据条目。
 * 只使用用户确认过的摘要，不使用原始音频或未确认转写。
 */
export function interviewEvidence(
  session: InterviewSession,
  levels: Record<string, EvidenceLevel>,
): Evidence[] {
  return session.turns
    .filter((t) => t.summary_confirmed && t.answer_summary.trim().length > 0)
    .map((t) => ({
      evidence_id: answerEvidenceId(t.turn_id),
      claim: t.answer_summary,
      quote: t.answer_summary,
      material_ref: `模拟面试 / ${t.question}`,
      level: levels[t.turn_id] ?? "L2",
      source: "InterviewAnswer" as const,
      confirmed: true,
      edited_by_user: false,
    }));
}

/** 合并材料证据与面试回答证据，得到 Agent 可引用的完整池。 */
export function buildEvidencePool(input: {
  profile: CandidateProfile;
  session: InterviewSession;
  answerLevels: Record<string, EvidenceLevel>;
  allowedEvidenceIds: string[];
  allowedTurnIds: string[];
}): Evidence[] {
  const allowedEvidence = new Set(input.allowedEvidenceIds);
  const allowedTurns = new Set(input.allowedTurnIds);
  const fromMaterials = input.profile.evidence.filter(
    (e) => e.confirmed && allowedEvidence.has(e.evidence_id),
  );
  const fromInterview = interviewEvidence(
    {
      ...input.session,
      turns: input.session.turns.filter((t) => allowedTurns.has(t.turn_id)),
    },
    input.answerLevels,
  );
  return [...fromMaterials, ...fromInterview];
}
