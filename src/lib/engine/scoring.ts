import {
  EVIDENCE_RELIABILITY,
  type AgentSuggestion,
  type EvidenceLevel,
} from "@/lib/schema/enums";
import type {
  CompetencyCriterion,
  CriterionAssessment,
  HardRequirementCheck,
} from "@/lib/schema/domain";
import { clamp, round } from "./util";

/**
 * 阈值按本项目的加权口径校准，可配置。
 * criterion_score 上限受证据等级约束（L2 最高 0.75），
 * 因此 100 分制下的"高匹配"实际落在 70 以上而非 80 以上。
 */
export const SCORING_THRESHOLDS = {
  recommendMin: 70,
  reviewMin: 45,
  lowConfidence: 0.5,
  highWeight: 20,
} as const;

export class WeightSumError extends Error {
  readonly total: number;
  constructor(total: number) {
    super(`岗位能力权重合计必须为 100%，当前为 ${round(total, 2)}%`);
    this.name = "WeightSumError";
    this.total = total;
  }
}

export function weightSum(criteria: Pick<CompetencyCriterion, "weight">[]): number {
  return round(
    criteria.reduce((sum, c) => sum + c.weight, 0),
    2,
  );
}

/** 权重合计校验，允许 0.01 的浮点误差。 */
export function validateWeights(criteria: Pick<CompetencyCriterion, "weight">[]): {
  ok: boolean;
  total: number;
  message: string;
} {
  const total = weightSum(criteria);
  const ok = Math.abs(total - 100) < 0.01;
  return {
    ok,
    total,
    message: ok
      ? "权重合计 100%，校验通过"
      : `权重合计 ${total}%，还需调整 ${round(100 - total, 2)}%`,
  };
}

export function assertWeights(criteria: Pick<CompetencyCriterion, "weight">[]): void {
  const result = validateWeights(criteria);
  if (!result.ok) throw new WeightSumError(result.total);
}

export function reliabilityOf(level: EvidenceLevel): number {
  return EVIDENCE_RELIABILITY[level];
}

/**
 * 单项得分 = fit_score/100 * 证据可靠度 * completeness/100。
 * L0 证据可靠度为 0，因此永远不会因为"没有材料"而拿到分数，
 * 但同样也不能反过来判定为"不具备能力"，由 gapTypeOf 保证。
 */
export function criterionScore(input: {
  fit_score: number;
  evidence_level: EvidenceLevel;
  completeness: number;
}): number {
  const fit = clamp(input.fit_score, 0, 100) / 100;
  const completeness = clamp(input.completeness, 0, 100) / 100;
  return round(fit * reliabilityOf(input.evidence_level) * completeness, 4);
}

/** 缺失证据必须落到 evidence_missing / unknown，绝不能写成 capability_gap。 */
export function gapTypeOf(input: {
  evidence_level: EvidenceLevel;
  fit_score: number;
  completeness: number;
}): CriterionAssessment["gap_type"] {
  if (input.evidence_level === "L0") return "evidence_missing";
  if (input.completeness < 40) return "unknown";
  if (input.evidence_level === "L1" && input.fit_score < 60) return "evidence_missing";
  if (input.fit_score < 50) return "capability_gap";
  if (input.fit_score < 75) return "unknown";
  return "none";
}

export function softMatchScore(assessments: CriterionAssessment[]): number {
  const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0);
  if (totalWeight <= 0) return 0;
  const weighted = assessments.reduce(
    (sum, a) => sum + a.criterion_score * a.weight,
    0,
  );
  return round(clamp((weighted / totalWeight) * 100, 0, 100), 2);
}

/**
 * 置信度基于证据覆盖度和硬性条件确认情况，不是分数的平均值。
 */
export function assessmentConfidence(
  assessments: CriterionAssessment[],
  hardChecks: HardRequirementCheck[],
): number {
  if (assessments.length === 0) return 0;
  const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0) || 1;
  const evidenceCoverage =
    assessments.reduce(
      (sum, a) => sum + reliabilityOf(a.evidence_level) * a.weight,
      0,
    ) / totalWeight;
  const completeness =
    assessments.reduce((sum, a) => sum + (a.completeness / 100) * a.weight, 0) /
    totalWeight;
  const unresolvedHard = hardChecks.filter(
    (c) => c.status === "insufficient_evidence",
  ).length;
  const penalty = Math.min(0.3, unresolvedHard * 0.15);
  return round(clamp(evidenceCoverage * 0.6 + completeness * 0.4 - penalty, 0, 1), 3);
}

export function isInfoInsufficient(
  assessments: CriterionAssessment[],
  confidence: number,
): boolean {
  // 高权重能力项只要"拿不到足够证据去判断"，就算信息不足，
  // 而不是把它当成候选人不具备该能力。
  const unjudgeableHighWeight = assessments.some(
    (a) =>
      a.weight >= SCORING_THRESHOLDS.highWeight &&
      (a.evidence_level === "L0" ||
        a.gap_type === "evidence_missing" ||
        a.gap_type === "unknown"),
  );
  return confidence < SCORING_THRESHOLDS.lowConfidence || unjudgeableHighWeight;
}

/**
 * Agent 建议由确定性规则给出，LLM 只能提供 fit_score / finding 等素材。
 */
export function decideSuggestion(input: {
  score: number;
  confidence: number;
  assessments: CriterionAssessment[];
  hardChecks: HardRequirementCheck[];
}): { suggestion: AgentSuggestion; reasonKey: string } {
  const unresolvedMustHave = input.hardChecks.filter(
    (c) => c.status === "insufficient_evidence",
  );
  const failedMustHave = input.hardChecks.filter((c) => c.status === "not_met");

  if (failedMustHave.length > 0) {
    return { suggestion: "not_recommended_yet", reasonKey: "hard_requirement_not_met" };
  }
  if (unresolvedMustHave.length > 0) {
    return {
      suggestion: "human_review_required",
      reasonKey: "hard_requirement_evidence_missing",
    };
  }
  if (input.confidence < SCORING_THRESHOLDS.lowConfidence) {
    return { suggestion: "human_review_required", reasonKey: "low_confidence" };
  }

  const highWeightEvidenceGap = input.assessments.some(
    (a) =>
      a.weight >= SCORING_THRESHOLDS.highWeight && a.gap_type === "evidence_missing",
  );

  if (input.score >= SCORING_THRESHOLDS.recommendMin && !highWeightEvidenceGap) {
    return { suggestion: "recommend_interview", reasonKey: "strong_match" };
  }
  if (input.score >= SCORING_THRESHOLDS.reviewMin || highWeightEvidenceGap) {
    return {
      suggestion: "human_review_required",
      reasonKey: highWeightEvidenceGap ? "high_weight_evidence_gap" : "borderline_score",
    };
  }
  const clearCapabilityGaps = input.assessments.filter(
    (a) => a.gap_type === "capability_gap",
  ).length;
  if (clearCapabilityGaps >= 2) {
    return { suggestion: "not_recommended_yet", reasonKey: "multiple_capability_gaps" };
  }
  return { suggestion: "not_recommended_yet", reasonKey: "low_score" };
}

export const SUGGESTION_REASON_TEXT: Record<string, string> = {
  hard_requirement_not_met: "存在明确不满足的硬性条件，因此暂不邀约。",
  hard_requirement_evidence_missing:
    "硬性条件缺少可核验证据，无法自动判断，转人工复核。",
  low_confidence: "整体证据不足导致置信度偏低，转人工复核而非直接否定。",
  strong_match: "关键能力均有可核验证据支撑，匹配度高，建议邀约。",
  high_weight_evidence_gap: "高权重能力缺少证据，需人工复核补充材料后判断。",
  borderline_score: "匹配度处于中间区间，建议人工复核。",
  multiple_capability_gaps: "多项核心能力存在明确差距，暂不邀约。",
  low_score: "整体匹配度偏低，暂不邀约。",
};
