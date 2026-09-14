"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { Notice } from "@/components/ui";
import { ProviderStatusStrip } from "@/components/provider-status";

type DemoResult = {
  report_id: string;
  tasks: { task_id: string; job_version_id: string; messages: number }[];
};

export function LandingActions({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState("");

  async function runDemo() {
    setBusy(true);
    setError("");
    const response = await callApi<DemoResult>("/api/demo/run", {});
    if (response.ok) {
      setResult(response.data);
      await refresh();
    } else {
      setError(response.blockers.join("、"));
    }
    setBusy(false);
  }

  async function resetDemo() {
    setBusy(true);
    setError("");
    const response = await callApi<{ reset: boolean }>("/api/reset", {});
    if (response.ok) {
      setResult(null);
      await refresh();
    } else {
      setError(response.blockers.join("、"));
    }
    setBusy(false);
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/candidate"
          className="group flex min-h-20 items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-600 px-5 text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-[0.99]"
        >
          <span>
            <span className="block text-xs text-indigo-200">我是</span>
            <span className="mt-1 block text-lg font-semibold">求职者登录</span>
          </span>
          <span className="text-2xl transition-transform group-hover:translate-x-1">→</span>
        </Link>
        <Link
          href="/employer"
          className="group flex min-h-20 items-center justify-between rounded-2xl border border-slate-300 bg-white px-5 text-slate-900 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 active:scale-[0.99]"
        >
          <span>
            <span className="block text-xs text-slate-400">我是</span>
            <span className="mt-1 block text-lg font-semibold">招聘方登录</span>
          </span>
          <span className="text-2xl text-slate-400 transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">先看完整 Demo</p>
          <p className="mt-1 text-xs text-slate-500">三场 Agent 对话 · 一份提升安排。</p>
        </div>
        <Button variant="secondary" onClick={runDemo} busy={busy}>
          观看完整 Demo
        </Button>
      </div>

      {result && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <span>Demo 已完成 · {result.tasks.length} 个岗位 Agent 已沟通</span>
          <Link href="/marketplace" className="font-medium underline underline-offset-2">去求职广场</Link>
          <Link href="/candidate/workbench" className="font-medium underline underline-offset-2">看我的工作台</Link>
        </div>
      )}
      {error && <Notice tone="warn">{error}</Notice>}

      <details className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
        <summary className="cursor-pointer font-medium text-slate-700">演示设置</summary>
        <div className="mt-3 space-y-3">
          <ProviderStatusStrip state={state} />
          <button type="button" onClick={resetDemo} className="text-slate-500 underline underline-offset-2 hover:text-indigo-700">
            重置演示数据
          </button>
        </div>
      </details>
    </section>
  );
}
