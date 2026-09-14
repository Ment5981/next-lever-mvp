import { beforeEach, describe, expect, it } from "vitest";

import { POST as runDemo } from "@/app/api/demo/run/route";
import { POST as reset } from "@/app/api/reset/route";
import { POST as setDisclosureRoute } from "@/app/api/candidate/disclosure/route";
import { POST as publishAgent } from "@/app/api/candidate/agent/route";
import { POST as authorizeRoute } from "@/app/api/authorize/route";
import { POST as dispatchRoute } from "@/app/api/a2a/dispatch/route";
import { POST as decisionRoute } from "@/app/api/employer/decision/route";
import { POST as reportRoute } from "@/app/api/growth/report/route";
import { POST as confirmJob } from "@/app/api/employer/job/confirm/route";
import { GET as stateRoute } from "@/app/api/state/route";
import { defaultDisclosure } from "@/lib/demo/scenario";
import { PRESET_JOB_VERSIONS } from "@/lib/demo/preset-jobs";
import { resetIdCounter } from "@/lib/engine/util";
import { resetStore } from "@/lib/store/store";

const BASE = "http://localhost:3000";

function post(path: string, body?: unknown): Request {
  return new Request(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

type Envelope<T> = { ok: boolean; data?: T; blockers?: string[] };

async function read<T>(response: Response): Promise<Envelope<T>> {
  return (await response.json()) as Envelope<T>;
}

describe("API 主流程", () => {
  beforeEach(() => {
    resetStore();
    resetIdCounter();
  });

  it("未确认披露范围时不能生成可投递 Agent", async () => {
    const res = await publishAgent(post("/api/candidate/agent"));
    const body = await read(res);
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.blockers?.join("")).toContain("披露范围");
  });

  it("未生成 Agent 时不能授权，也不会创建任何申请", async () => {
    const ids = PRESET_JOB_VERSIONS.map((j) => j.job_version_id);
    const res = await authorizeRoute(
      post("/api/authorize", {
        job_version_ids: ids,
        acknowledged_job_count: ids.length,
      }),
    );
    const body = await read(res);
    expect(body.ok).toBe(false);
    expect(body.blockers?.join("")).toContain("求职者 Agent");

    const state = await read<{ applications: unknown[] }>(await stateRoute());
    expect(state.data?.applications).toHaveLength(0);
  });

  it("未授权时不能发送任何 A2A 申请", async () => {
    const res = await dispatchRoute(post("/api/a2a/dispatch"));
    const body = await read(res);
    expect(body.ok).toBe(false);
    expect(body.blockers?.join("")).toMatch(/未授权|求职者 Agent/);

    const state = await read<{ tasks: unknown[] }>(await stateRoute());
    expect(state.data?.tasks).toHaveLength(0);
  });

  it("界面确认数量与提交岗位数不一致时拒绝授权", async () => {
    await setDisclosureRoute(
      post("/api/candidate/disclosure", {
        scope: defaultDisclosure(),
        confirmed: true,
      }),
    );
    await publishAgent(post("/api/candidate/agent"));

    const ids = PRESET_JOB_VERSIONS.map((j) => j.job_version_id);
    const res = await authorizeRoute(
      post("/api/authorize", {
        job_version_ids: ids,
        acknowledged_job_count: ids.length - 1,
      }),
    );
    const body = await read(res);
    expect(body.ok).toBe(false);
    expect(body.blockers?.join("")).toContain("已拒绝本次授权");
  });

  it("岗位权重合计不为 100% 时拒绝确认版本", async () => {
    const preset = PRESET_JOB_VERSIONS[0];
    const skewed = {
      ...preset,
      job_id: "job_weight_probe",
      criteria: preset.criteria.map((c, i) =>
        i === 0 ? { ...c, weight: c.weight + 5 } : c,
      ),
    };
    const res = await confirmJob(post("/api/employer/job/confirm", skewed));
    const body = await read(res);
    expect(body.ok).toBe(false);
    expect(body.blockers?.join("")).toContain("权重合计 105%");
  });

  it("同一岗位再次确认只追加新版本，不覆盖旧版本", async () => {
    const preset = PRESET_JOB_VERSIONS[0];
    const res = await confirmJob(
      post("/api/employer/job/confirm", { ...preset, job_id: "job_a" }),
    );
    const body = await read<{ job: { job_version_id: string; version: number } }>(res);
    expect(body.ok).toBe(true);
    expect(body.data?.job.version).toBe(2);
    expect(body.data?.job.job_version_id).toBe("job_a_v2");

    const state = await read<{ jobs: { job_version_id: string }[] }>(
      await stateRoute(),
    );
    const ids = state.data?.jobs.map((j) => j.job_version_id) ?? [];
    expect(ids).toContain("jv_job_a_v1");
    expect(ids).toContain("job_a_v2");
  });

  it(
    "完整 Demo 跑通：三个 A2A 任务、三种建议、真人确认与成长报告",
    async () => {
      const res = await runDemo(post("/api/demo/run"));
      const body = await read<{
        steps: { step: string }[];
        tasks: {
          task_id: string;
          job_version_id: string;
          state: string;
          messages: number;
          artifacts: number;
          clarification_rounds: number;
        }[];
      }>(res);

      expect(body.ok).toBe(true);
      const steps = body.data?.steps.map((s) => s.step) ?? [];
      expect(steps).toEqual([
        "reset",
        "disclosure",
        "candidate_agent",
        "authorize",
        "applications",
        "a2a",
        "human_confirm",
        "growth_report",
      ]);

      const tasks = body.data?.tasks ?? [];
      expect(tasks).toHaveLength(3);
      // 三个任务各自独立：task_id 不重复，且都有消息与 Artifact。
      expect(new Set(tasks.map((t) => t.task_id)).size).toBe(3);
      for (const task of tasks) {
        expect(task.state).toBe("TASK_STATE_COMPLETED");
        expect(task.messages).toBeGreaterThan(0);
        expect(task.artifacts).toBeGreaterThan(0);
      }
      // 至少一次 A2A 追问与回答。
      expect(tasks.reduce((sum, t) => sum + t.clarification_rounds, 0)).toBeGreaterThan(0);

      const state = await read<{
        assessments: { suggestion: string; job_version_id: string }[];
        decisions: { decision: string; task_id: string }[];
        reports: {
          signals: { category: string }[];
          growth_tasks: { zhihu_resources: unknown[] }[];
        }[];
      }>(await stateRoute());

      const suggestions = state.data?.assessments.map((a) => a.suggestion) ?? [];
      expect(new Set(suggestions)).toEqual(
        new Set(["recommend_interview", "not_recommended_yet", "human_review_required"]),
      );

      // 真人决策与 Agent 建议分开存储，数量各自独立成立。
      expect(state.data?.decisions).toHaveLength(3);

      const report = state.data?.reports.at(-1);
      const categories = new Set(report?.signals.map((s) => s.category) ?? []);
      expect(categories).toEqual(
        new Set(["repeated_signal", "job_specific", "evidence_problem", "conflicting"]),
      );
      expect(report?.growth_tasks.length).toBeGreaterThan(0);
    },
    180000,
  );

  it(
    "真人决策偏离 Agent 建议时必须填写覆盖理由",
    async () => {
      await runDemo(post("/api/demo/run"));
      const state = await read<{
        tasks: { task_id: string; job_version_id: string }[];
      }>(await stateRoute());
      const taskA = state.data?.tasks.find(
        (t) => t.job_version_id === "jv_job_a_v1",
      );
      expect(taskA).toBeDefined();

      // Agent 建议邀约，真人改成暂不邀约，且不给覆盖理由。
      const res = await decisionRoute(
        post("/api/employer/decision", {
          task_id: taskA!.task_id,
          decision: "not_invited",
          reason: "本轮名额已满",
        }),
      );
      const body = await read(res);
      expect(body.ok).toBe(false);
      expect(body.blockers?.join("")).toContain("覆盖理由");

      const withReason = await decisionRoute(
        post("/api/employer/decision", {
          task_id: taskA!.task_id,
          decision: "not_invited",
          reason: "本轮名额已满",
          override_reason: "岗位在本轮冻结招聘，与候选人能力评估无关。",
        }),
      );
      const okBody = await read<{
        decision: { overrode_agent: boolean };
        agent_suggestion: string;
      }>(withReason);
      expect(okBody.ok).toBe(true);
      expect(okBody.data?.decision.overrode_agent).toBe(true);
      // Agent 建议未被真人决策改写。
      expect(okBody.data?.agent_suggestion).toBe("recommend_interview");
    },
    180000,
  );

  it("样本不完整时不生成成长报告", async () => {
    await setDisclosureRoute(
      post("/api/candidate/disclosure", {
        scope: defaultDisclosure(),
        confirmed: true,
      }),
    );
    await publishAgent(post("/api/candidate/agent"));
    const ids = PRESET_JOB_VERSIONS.map((j) => j.job_version_id);
    await authorizeRoute(
      post("/api/authorize", {
        job_version_ids: ids,
        acknowledged_job_count: ids.length,
      }),
    );

    // 已授权 3 个岗位但还没有任何评估结果。
    const res = await reportRoute(post("/api/growth/report", {}));
    const body = await read(res);
    expect(body.ok).toBe(false);
    expect(body.blockers?.join("")).toContain("全部岗位返回后再生成报告");
  });

  it("Reset 清空任务、评估与决策", async () => {
    await runDemo(post("/api/demo/run"));
    await reset();
    const state = await read<{
      tasks: unknown[];
      assessments: unknown[];
      decisions: unknown[];
      reports: unknown[];
      candidate_agent: unknown;
    }>(await stateRoute());
    expect(state.data?.tasks).toHaveLength(0);
    expect(state.data?.assessments).toHaveLength(0);
    expect(state.data?.decisions).toHaveLength(0);
    expect(state.data?.reports).toHaveLength(0);
    expect(state.data?.candidate_agent).toBeNull();
  }, 180000);
});
