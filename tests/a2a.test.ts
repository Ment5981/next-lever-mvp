import { beforeAll, describe, expect, it } from "vitest";
import { dispatchAuthorizedApplications } from "@/lib/a2a/orchestrator";
import { PRESET_JOB_VERSIONS } from "@/lib/demo/preset-jobs";
import { resetIdCounter } from "@/lib/engine/util";
import {
  authorize,
  createApplications,
  getDisclosure,
  listApplications,
  listAssessments,
  listTasks,
  publishCandidateAgent,
  resetStore,
  setDisclosure,
} from "@/lib/store/store";

const JOB_IDS = PRESET_JOB_VERSIONS.map((j) => j.job_version_id);

describe("授权门槛", () => {
  beforeAll(() => {
    resetStore();
    resetIdCounter();
  });

  it("披露范围未确认时不能生成可投递 Agent", () => {
    const result = publishCandidateAgent();
    expect(result.ok).toBe(false);
    expect(result.agent).toBeNull();
    expect(result.blockers.join(" ")).toMatch(/披露范围/);
  });

  it("未生成 Agent 时不能授权", () => {
    const result = authorize(JOB_IDS);
    expect(result.ok).toBe(false);
    expect(result.authorization).toBeNull();
  });

  it("未授权时不发送任何申请", async () => {
    const outcome = await dispatchAuthorizedApplications();
    expect(outcome.ok).toBe(false);
    expect(listTasks()).toHaveLength(0);
    expect(outcome.blockers.join(" ")).toMatch(/Agent|授权/);
  });
});

describe("三个岗位的 A2A 会话", () => {
  beforeAll(async () => {
    resetStore();
    resetIdCounter();
    const { scope } = getDisclosure();
    setDisclosure(scope, true);
    const published = publishCandidateAgent();
    expect(published.ok).toBe(true);
    const auth = authorize(JOB_IDS);
    expect(auth.ok).toBe(true);
    const batch = createApplications(auth.authorization!.authorization_id);
    expect(batch.ok).toBe(true);
    const outcome = await dispatchAuthorizedApplications();
    expect(outcome.ok).toBe(true);
  });

  it("生成三个独立 Task，每个都有独立 context 与终态", () => {
    const tasks = listTasks();
    expect(tasks).toHaveLength(3);
    expect(new Set(tasks.map((t) => t.task_id)).size).toBe(3);
    expect(new Set(tasks.map((t) => t.context_id)).size).toBe(3);
    for (const task of tasks) {
      expect(task.state).toBe("TASK_STATE_COMPLETED");
      expect(task.protocol_version).toBe("1.0");
    }
  });

  it("每个 Task 都有状态时间线、消息和 Artifact", () => {
    for (const task of listTasks()) {
      expect(task.state_history.length).toBeGreaterThanOrEqual(3);
      expect(task.messages.length).toBeGreaterThanOrEqual(2);
      expect(task.artifacts).toHaveLength(1);
      const types = task.messages.map((m) => m.envelope.message_type);
      expect(types).toContain("application_submit");
      expect(types).toContain("assessment_result");
    }
  });

  it("至少一次 A2A 追问并得到回答", () => {
    const withClarification = listTasks().filter((t) =>
      t.messages.some((m) => m.envelope.message_type === "clarification_request"),
    );
    expect(withClarification.length).toBeGreaterThanOrEqual(1);
    for (const task of withClarification) {
      const types = task.messages.map((m) => m.envelope.message_type);
      expect(types).toContain("clarification_response");
      expect(task.clarification_rounds).toBeGreaterThanOrEqual(1);
      expect(task.clarification_rounds).toBeLessThanOrEqual(2);
      expect(task.state_history.map((s) => s.state)).toContain(
        "TASK_STATE_INPUT_REQUIRED",
      );
    }
  });

  it("每条消息都带完整信封，可追溯发送方与材料版本", () => {
    for (const task of listTasks()) {
      for (const message of task.messages) {
        const env = message.envelope;
        expect(env.task_id).toBe(task.task_id);
        expect(env.message_id).toBeTruthy();
        expect(env.sender).toMatch(/^(candidate_agent|job_agent):/);
        expect(env.receiver).toMatch(/^(candidate_agent|job_agent):/);
        expect(env.job_version_id).toBe(task.job_version_id);
        expect(env.material_version).toBeGreaterThan(0);
        expect(env.timestamp).toBeTruthy();
      }
    }
  });

  it("三份评估产出三种不同建议", () => {
    const assessments = listAssessments();
    expect(assessments).toHaveLength(3);
    expect(new Set(assessments.map((a) => a.suggestion)).size).toBe(3);
  });

  it("申请状态经状态机推进到 assessed", () => {
    const apps = listApplications();
    expect(apps).toHaveLength(3);
    for (const app of apps) {
      expect(app.state).toBe("assessed");
    }
  });

  it("Artifact 载荷即评估结果，可与 Task 对应", () => {
    for (const task of listTasks()) {
      const artifact = task.artifacts[0];
      const payload = artifact.payload as { task_id: string; job_version_id: string };
      expect(payload.task_id).toBe(task.task_id);
      expect(payload.job_version_id).toBe(task.job_version_id);
    }
  });

  it("披露范围之外的内容不会出现在申请消息里", () => {
    const auth = listTasks()[0];
    const submit = auth.messages.find(
      (m) => m.envelope.message_type === "application_submit",
    );
    const payload = submit?.data as { evidence: { evidence_id: string }[] };
    const allowed = new Set(getDisclosure().scope.evidence_ids);
    for (const item of payload.evidence) {
      // 面试回答证据以 ans_ 前缀派生，其余必须在授权证据列表内。
      if (item.evidence_id.startsWith("ans_")) continue;
      expect(allowed.has(item.evidence_id)).toBe(true);
    }
  });

  it("求职者 Agent 不会发送简历全文", () => {
    for (const task of listTasks()) {
      for (const message of task.messages) {
        expect(message.text).not.toMatch(/教育：某双一流高校/);
      }
    }
  });
});
