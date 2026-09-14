import type {
  CandidateProfile,
  CompetencyCriterion,
  CriterionAssessment,
  Evidence,
  HardRequirementCheck,
  JobAssessment,
  JobVersion,
} from "@/lib/schema/domain";
import { z } from "zod";
import {
  SUGGESTION_REASON_TEXT,
  assessmentConfidence,
  criterionScore,
  decideSuggestion,
  gapTypeOf,
  isInfoInsufficient,
  softMatchScore,
} from "./scoring";
import { nowIso, round } from "./util";

/**
 * LLM 只负责产出这些"素材"字段，最终分数、建议和状态全部由确定性规则计算。
 */
export const CriterionJudgment = z.object({
  criterion_id: z.string().min(1),
  fit_score: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  evidence_ids: z.array(z.string()).default([]),
  finding: z.string().min(1).max(600),
  hard_status: z
    .enum(["met", "not_met", "insufficient_evidence"])
    .nullable()
    .default(null),
  hard_note: z.string().max(600).default(""),
});
export type CriterionJudgment = z.infer<typeof CriterionJudgment>;

export const AssessmentJudgment = z.object({
  criteria: z.array(CriterionJudgment).min(1),
  strengths: z.array(z.string().min(1).max(400)).max(6).default([]),
  evidence_gaps: z.array(z.string().min(1).max(400)).max(6).default([]),
  next_actions: z.array(z.string().min(1).max(400)).max(6).default([]),
});
export type AssessmentJudgment = z.infer<typeof AssessmentJudgment>;

/**
 * 证据等级由平台按已确认证据推导，不交给模型，避免模型抬高证据等级。
 * 取该能力项引用证据中的最高等级；没有引用证据即为 L0。
 */
export function deriveEvidenceLevel(
  evidenceIds: string[],
  pool: Evidence[],
): Evidence["level"] {
  const order: Evidence["level"][] = ["L0", "L1", "L2", "L3"];
  let best: Evidence["level"] = "L0";
  for (const id of evidenceIds) {
    const found = pool.find((e) => e.evidence_id === id && e.confirmed);
    if (!found) continue;
    if (order.indexOf(found.level) > order.indexOf(best)) best = found.level;
  }
  return best;
}

/** 只允许使用求职者已确认且在披露范围内的证据。 */
export function visibleEvidence(
  profile: CandidateProfile,
  allowedIds: string[],
): Evidence[] {
  const allowed = new Set(allowedIds);
  return profile.evidence.filter((e) => e.confirmed && allowed.has(e.evidence_id));
}

export function buildCriterionAssessment(
  criterion: CompetencyCriterion,
  judgment: CriterionJudgment,
  evidencePool: Evidence[],
): CriterionAssessment {
  const usableIds = judgment.evidence_ids.filter((id) =>
    evidencePool.some((e) => e.evidence_id === id),
  );
  const level = deriveEvidenceLevel(usableIds, evidencePool);
  const completeness = level === "L0" ? 0 : judgment.completeness;
  // 当判断层已声明"无法核验"时，必须归类为证据缺失，
  // 不能因为 fit_score 偏低就被 gapTypeOf 改写成 capability_gap。
  const gap_type =
    judgment.hard_status === "insufficient_evidence"
      ? "evidence_missing"
      : gapTypeOf({
          evidence_level: level,
          fit_score: judgment.fit_score,
          completeness,
        });
  return {
    criterion_id: criterion.criterion_id,
    criterion_name: criterion.name,
    weight: criterion.weight,
    must_have: criterion.must_have,
    fit_score: round(judgment.fit_score, 2),
    evidence_level: level,
    completeness: round(completeness, 2),
    criterion_score: criterionScore({
      fit_score: judgment.fit_score,
      evidence_level: level,
      completeness,
    }),
    evidence_ids: usableIds,
    finding: judgment.finding,
    gap_type,
    source: "JobAgentInference",
  };
}

/**
 * 硬性条件单独判断，不参与加权分数的"折算"逻辑，
 * 并且缺证据只能是 insufficient_evidence，不能写成 not_met。
 */
export function buildHardChecks(
  criteria: CompetencyCriterion[],
  judgments: CriterionJudgment[],
  assessments: CriterionAssessment[],
): HardRequirementCheck[] {
  return criteria
    .filter((c) => c.must_have)
    .map((c) => {
      const judgment = judgments.find((j) => j.criterion_id === c.criterion_id);
      const assessment = assessments.find((a) => a.criterion_id === c.criterion_id);
      let status: HardRequirementCheck["status"] = "insufficient_evidence";
      if (assessment && assessment.evidence_level !== "L0") {
        if (judgment?.hard_status) {
          status = judgment.hard_status;
        } else if (assessment.fit_score >= 70 && assessment.completeness >= 60) {
          status = "met";
        }
      }
      const note =
        judgment?.hard_note ||
        (status === "insufficient_evidence"
          ? "当前材料未提供可核验证据，无法判断是否满足，不视为不具备该能力。"
          : assessment?.finding ||
            "");
      return {
        criterion_id: c.criterion_id,
        criterion_name: c.name,
        status,
        note,
      };
    });
}

export function composeAssessment(input: {
  assessmentId: string;
  taskId: string;
  job: JobVersion;
  candidateAgentId: string;
  judgment: AssessmentJudgment;
  evidencePool: Evidence[];
}): JobAssessment {
  const assessments = input.job.criteria.map((criterion) => {
    const judgment =
      input.judgment.criteria.find((j) => j.criterion_id === criterion.criterion_id) ??
      ({
        criterion_id: criterion.criterion_id,
        fit_score: 0,
        completeness: 0,
        evidence_ids: [],
        finding: "未在本次沟通中获得与该项相关的材料，信息不足。",
        hard_status: null,
        hard_note: "",
      } satisfies CriterionJudgment);
    return buildCriterionAssessment(criterion, judgment, input.evidencePool);
  });

  const hardChecks = buildHardChecks(
    input.job.criteria,
    input.judgment.criteria,
    assessments,
  );
  const score = softMatchScore(assessments);
  const confidence = assessmentConfidence(assessments, hardChecks);
  const { suggestion, reasonKey } = decideSuggestion({
    score,
    confidence,
    assessments,
    hardChecks,
  });

  const detail = buildReasonDetail(reasonKey, assessments, hardChecks);

  return {
    assessment_id: input.assessmentId,
    task_id: input.taskId,
    job_version_id: input.job.job_version_id,
    candidate_agent_id: input.candidateAgentId,
    soft_match_score: score,
    confidence,
    suggestion,
    suggestion_reason: `${SUGGESTION_REASON_TEXT[reasonKey] ?? reasonKey}${detail}`,
    criterion_assessments: assessments,
    hard_requirements: hardChecks,
    strengths: input.judgment.strengths,
    evidence_gaps: input.judgment.evidence_gaps,
    next_actions: input.judgment.next_actions,
    info_insufficient: isInfoInsufficient(assessments, confidence),
    source: "JobAgentInference",
    created_at: nowIso(),
  };
}

function buildReasonDetail(
  reasonKey: string,
  assessments: CriterionAssessment[],
  hardChecks: HardRequirementCheck[],
): string {
  if (reasonKey === "hard_requirement_not_met") {
    const names = hardChecks
      .filter((c) => c.status === "not_met")
      .map((c) => c.criterion_name);
    return ` 涉及硬性条件：${names.join("、")}。`;
  }
  if (reasonKey === "hard_requirement_evidence_missing") {
    const names = hardChecks
      .filter((c) => c.status === "insufficient_evidence")
      .map((c) => c.criterion_name);
    return ` 待补充证据的硬性条件：${names.join("、")}。`;
  }
  if (reasonKey === "high_weight_evidence_gap") {
    const names = assessments
      .filter((a) => a.gap_type === "evidence_missing" && a.weight >= 20)
      .map((a) => a.criterion_name);
    return ` 高权重待补充项：${names.join("、")}。`;
  }
  if (reasonKey === "multiple_capability_gaps") {
    const names = assessments
      .filter((a) => a.gap_type === "capability_gap")
      .map((a) => a.criterion_name);
    return ` 差距项：${names.join("、")}。`;
  }
  if (reasonKey === "strong_match") {
    const names = assessments
      .filter((a) => a.gap_type === "none" && a.weight >= 20)
      .map((a) => a.criterion_name);
    return names.length > 0 ? ` 支撑项：${names.join("、")}。` : "";
  }
  return "";
}
