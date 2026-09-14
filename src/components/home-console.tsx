"use client";

import Link from "next/link";
import { useState } from "react";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { Button } from "./button";
import { ProviderStatusStrip } from "./provider-status";
import { Badge, Blockers, Notice, Panel } from "./ui";

type DemoStep = { step: string; detail: string };
type DemoRun = {
  steps: DemoStep[];
  report_id: string;
  tasks: {
    task_id: string;
    job_version_id: string;
    state: string;
    messages: number;
    artifacts: number;
    clarification_rounds: number;
  }[];
  blockers: string[];
};

/**
 * 首页控制台。
 *
 * 「观看完整 Demo」把主流程一次跑完，Reset 回到预置状态。
 * 两个动作都只在点击时触发，不轮询，也不会在切页时重复调用外部能力。
 */
export function HomeConsole({ initial }: { initial: WorkspaceState }) {
  const { state, blockers, setBlockers, refresh } = useWorkspace(initial);
  const [busy, setBusy] = useState<"demo" | "reset" | null>(null);
  const [run, setRun] = useState<DemoRun | null>(null);

  async function runDemo() {
    setBusy("demo");
    setRun(null);
    const result = await callApi<DemoRun>("/api/demo/run", {});
    if (result.ok) {
      setRun(result.data);
      setBlockers(result.data.blockers);
    } else {
      setBlockers(result.blockers);
    }
    await refresh();
    setBusy(null);
  }

  async function reset() {
    setBusy("reset");
    setRun(null);
    const result = await callApi<{ reset: boolean }>("/api/reset", {});
    setBlockers(result.ok ? [] : result.blockers);
    await refresh();
    setBusy(null);
  }

  const reportReady = state.reports.length > 0;

  return (
    <div className="space-y-5">
      <Panel
        title="进入工作台"
        subtitle="两侧入口都是真实流程，不是静态演示页。没有任何密钥时也能走完整条链路。"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/employer/job"
            className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <p className="font-medium text-slate-900">我是招聘方</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              文字或语音描述岗位，回答有限追问，确认可编辑的能力模型与权重，
              生成岗位版本和招聘方 Agent。
            </p>
          </Link>
          <Link
            href="/candidate/materials"
            className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <p className="font-medium text-slate-900">我是求职者</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              提交简历、项目与作品链接，逐条确认事实证据，完成岗位相关的模拟面试，
              确认披露范围后生成可投递 Agent。
            </p>
          </Link>
        </div>
      </Panel>

      <Panel
        title="演示控制台"
        subtitle="Demo 会按真实用户路径依次执行确认披露、生成 Agent、一次性授权、A2A 投递、真人确认、生成成长报告。"
        aside={
          <div className="flex flex-wrap gap-2">
            <Button onClick={runDemo} busy={busy === "demo"}>
              观看完整 Demo
            </Button>
            <Button variant="danger" onClick={reset} busy={busy === "reset"}>
              Reset
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <ProviderStatusStrip state={state} />
          <Blockers items={blockers} title="流程提示" />

          {run && (
            <div className="space-y-3">
              <ol className="space-y-2">
                {run.steps.map((step) => (
                  <li
                    key={step.step}
                    className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-emerald-900">
                      {step.step}
                    </span>
                    <span className="break-words text-emerald-800 sm:text-right">
                      {step.detail}
                    </span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2">
                {run.tasks.map((task) => (
                  <Badge key={task.task_id} tone="accent">
                    {task.job_version_id} · {task.messages} 条消息 ·{" "}
                    {task.artifacts} 个 Artifact · 追问 {task.clarification_rounds} 轮
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!run && reportReady && (
            <Notice tone="good">
              工作台已有成长报告，可直接查看
              <Link className="mx-1 underline" href="/growth">
                成长报告
              </Link>
              或
              <Link className="mx-1 underline" href="/a2a">
                A2A 时间线
              </Link>
              。
            </Notice>
          )}

          {reportReady && (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/a2a"
                className="text-sm text-indigo-700 underline underline-offset-2"
              >
                查看 A2A 申请时间线
              </Link>
              <Link
                href="/employer/inbox"
                className="text-sm text-indigo-700 underline underline-offset-2"
              >
                查看招聘方工作台
              </Link>
              <Link
                href="/growth"
                className="text-sm text-indigo-700 underline underline-offset-2"
              >
                查看成长报告
              </Link>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
