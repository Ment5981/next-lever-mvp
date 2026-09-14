import { describe, expect, it } from "vitest";
import {
  SCORING_THRESHOLDS,
  criterionScore,
  decideSuggestion,
  gapTypeOf,
  softMatchScore,
  validateWeights,
  weightSum,
} from "@/lib/engine/scoring";
import type { CriterionAssessment, HardRequirementCheck } from "@/lib/schema/domain";
import { PRESET_JOB_VERSIONS } from "@/lib/demo/preset-jobs";

function assessment(over: Partial<CriterionAssessment> = {}): CriterionAssessment {
  return {
    criterion_id: "c1",
    criterion_name: "能力",
    weight: 100,
    must_have: false,
    fit_score: 80,
    evidence_level: "L3",
    completeness: 100,
    criterion_score: 0.8,
    evidence_ids: [],
    finding: "finding",
    gap_type: "none",
    source: "JobAgentInference",
    ...over,
  };
}

describe("权重校验", () => {
  it("三个预置岗位的权重合计都是 100%", () => {
    for (const job of PRESET_JOB_VERSIONS) {
      expect(weightSum(job.criteria), job.title).toBe(100);
      expect(validateWeights(job.criteria).ok, job.title).toBe(true);
    }
  });

  it("权重不足 100% 时给出需要调整的差额", () => {
    const result = validateWeights([{ weight: 40 }, { weight: 30 }]);
    expect(result.ok).toBe(false);
    expect(result.total).toBe(70);
    expect(result.message).toContain("30");
  });

  it("权重超过 100% 同样不通过", () => {
    expect(validateWeights([{ weight: 60 }, { weight: 60 }]).ok).toBe(false);
  });
});

describe("证据等级影响得分", () => {
  it("L0 证据得分为 0，不产生任何正向分数", () => {
    expect(
      criterionScore({ fit_score: 100, evidence_level: "L0", completeness: 100 }),
    ).toBe(0);
  });

  it("证据等级越高得分越高", () => {
    const base = { fit_score: 100, completeness: 100 } as const;
    const l1 = criterionScore({ ...base, evidence_level: "L1" });
    const l2 = criterionScore({ ...base, evidence_level: "L2" });
    const l3 = criterionScore({ ...base, evidence_level: "L3" });
    expect(l1).toBeLessThan(l2);
    expect(l2).toBeLessThan(l3);
    expect(l3).toBe(1);
  });
});

describe("缺失证据不得写成不具备能力", () => {
  it("L0 一律归类为 evidence_missing", () => {
    expect(
      gapTypeOf({ evidence_level: "L0", fit_score: 0, completeness: 0 }),
    ).toBe("evidence_missing");
  });

  it("完整度过低归类为 unknown 而不是 capability_gap", () => {
    expect(
      gapTypeOf({ evidence_level: "L2", fit_score: 20, completeness: 30 }),
    ).toBe("unknown");
  });

  it("有充分证据且明确不匹配时才是 capability_gap", () => {
    expect(
      gapTypeOf({ evidence_level: "L2", fit_score: 30, completeness: 85 }),
    ).toBe("capability_gap");
  });
});

describe("加权分数", () => {
  it("按权重加权而非简单平均", () => {
    const score = softMatchScore([
      assessment({ criterion_id: "a", weight: 80, criterion_score: 1 }),
      assessment({ criterion_id: "b", weight: 20, criterion_score: 0 }),
    ]);
    expect(score).toBe(80);
  });
});

describe("建议规则由确定性逻辑决定", () => {
  const hardMet: HardRequirementCheck[] = [
    { criterion_id: "c1", criterion_name: "能力", status: "met", note: "" },
  ];

  it("硬性条件明确不满足时暂不邀约", () => {
    const result = decideSuggestion({
      score: 95,
      confidence: 0.9,
      assessments: [assessment()],
      hardChecks: [
        { criterion_id: "c1", criterion_name: "能力", status: "not_met", note: "" },
      ],
    });
    expect(result.suggestion).toBe("not_recommended_yet");
  });

  it("硬性条件证据不足时转人工复核，而不是直接否定", () => {
    const result = decideSuggestion({
      score: 95,
      confidence: 0.9,
      assessments: [assessment()],
      hardChecks: [
        {
          criterion_id: "c1",
          criterion_name: "能力",
          status: "insufficient_evidence",
          note: "",
        },
      ],
    });
    expect(result.suggestion).toBe("human_review_required");
  });

  it("置信度过低时转人工复核", () => {
    const result = decideSuggestion({
      score: 90,
      confidence: 0.3,
      assessments: [assessment()],
      hardChecks: hardMet,
    });
    expect(result.suggestion).toBe("human_review_required");
    expect(result.reasonKey).toBe("low_confidence");
  });

  it("高权重项缺证据时转人工复核", () => {
    const result = decideSuggestion({
      score: SCORING_THRESHOLDS.recommendMin + 5,
      confidence: 0.8,
      assessments: [assessment({ weight: 30, gap_type: "evidence_missing" })],
      hardChecks: hardMet,
    });
    expect(result.suggestion).toBe("human_review_required");
    expect(result.reasonKey).toBe("high_weight_evidence_gap");
  });

  it("证据充分且分数达标时建议邀约", () => {
    const result = decideSuggestion({
      score: SCORING_THRESHOLDS.recommendMin + 1,
      confidence: 0.8,
      assessments: [assessment()],
      hardChecks: hardMet,
    });
    expect(result.suggestion).toBe("recommend_interview");
  });
});
