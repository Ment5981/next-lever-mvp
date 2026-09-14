import { describe, expect, it } from "vitest";
import { composeAssessment, deriveEvidenceLevel } from "@/lib/engine/assessment";
import { DEMO_JUDGMENTS } from "@/lib/demo/judgments";
import { PRESET_JOB_VERSIONS } from "@/lib/demo/preset-jobs";
import { defaultDisclosure, demoEvidencePool } from "@/lib/demo/scenario";
import type { JobAssessment } from "@/lib/schema/domain";

function assess(jobVersionId: string): JobAssessment {
  const job = PRESET_JOB_VERSIONS.find((j) => j.job_version_id === jobVersionId)!;
  const pool = demoEvidencePool(defaultDisclosure());
  return composeAssessment({
    assessmentId: `as_${jobVersionId}`,
    taskId: `task_${jobVersionId}`,
    job,
    candidateAgentId: "ca_demo",
    judgment: DEMO_JUDGMENTS[jobVersionId],
    evidencePool: pool,
  });
}

describe("证据等级推导", () => {
  it("取引用证据中的最高等级", () => {
    const pool = demoEvidencePool(defaultDisclosure());
    expect(deriveEvidenceLevel(["ev_1", "ev_6"], pool)).toBe("L3");
  });

  it("没有引用到任何已确认证据时为 L0", () => {
    const pool = demoEvidencePool(defaultDisclosure());
    expect(deriveEvidenceLevel(["not_exist"], pool)).toBe("L0");
  });

  it("披露范围之外的证据不可引用", () => {
    const narrowed = { ...defaultDisclosure(), evidence_ids: ["ev_1"] };
    const pool = demoEvidencePool(narrowed);
    expect(deriveEvidenceLevel(["ev_1"], pool)).toBe("L3");
    expect(deriveEvidenceLevel(["ev_3"], pool)).toBe("L0");
  });
});

describe("三个预置岗位产出三种不同建议", () => {
  const a = assess("jv_job_a_v1");
  const b = assess("jv_job_b_v1");
  const c = assess("jv_job_c_v1");

  it("岗位 A 建议邀约", () => {
    expect(a.suggestion).toBe("recommend_interview");
  });

  it("岗位 B 暂不邀约，且理由指向业务验证与量化差距", () => {
    expect(b.suggestion).toBe("not_recommended_yet");
    expect(b.evidence_gaps.join(" ")).toMatch(/企业客户|指标/);
  });

  it("岗位 C 转人工复核，理由是硬性条件证据不足", () => {
    expect(c.suggestion).toBe("human_review_required");
    const runnable = c.hard_requirements.find(
      (h) => h.criterion_id === "jv_job_c_v1_c1",
    );
    expect(runnable?.status).toBe("insufficient_evidence");
  });

  it("三个岗位的建议互不相同", () => {
    expect(new Set([a.suggestion, b.suggestion, c.suggestion]).size).toBe(3);
  });

  it("三个岗位的理由文本各不相同", () => {
    expect(
      new Set([a.suggestion_reason, b.suggestion_reason, c.suggestion_reason]).size,
    ).toBe(3);
  });

  it("三个岗位的后续动作各不相同", () => {
    expect(a.next_actions).not.toEqual(b.next_actions);
    expect(b.next_actions).not.toEqual(c.next_actions);
  });
});

describe("缺失证据的表述边界", () => {
  it("岗位 C 的可运行作品不能被判定为不具备能力", () => {
    const c = assess("jv_job_c_v1");
    const item = c.criterion_assessments.find(
      (x) => x.criterion_id === "jv_job_c_v1_c1",
    );
    expect(item?.gap_type).not.toBe("capability_gap");
    expect(c.info_insufficient).toBe(true);
  });

  it("岗位 B 的差距来自求职者已确认的经历范围，属于明确差距", () => {
    const b = assess("jv_job_b_v1");
    const item = b.criterion_assessments.find(
      (x) => x.criterion_id === "jv_job_b_v1_c1",
    );
    expect(item?.gap_type).toBe("capability_gap");
  });

  it("所有能力项都带有 JobAgentInference 来源标签", () => {
    for (const id of ["jv_job_a_v1", "jv_job_b_v1", "jv_job_c_v1"]) {
      const result = assess(id);
      for (const item of result.criterion_assessments) {
        expect(item.source).toBe("JobAgentInference");
      }
      expect(result.source).toBe("JobAgentInference");
    }
  });
});
