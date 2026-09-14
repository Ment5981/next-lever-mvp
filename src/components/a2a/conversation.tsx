"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import { Badge, Blockers, Notice } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { stateText } from "@/lib/a2a/protocol";

export function A2AConversation({ initial, jobVersionId, embedded = false, active = false, onClose }: { initial: WorkspaceState; jobVersionId: string; embedded?: boolean; active?: boolean; onClose?: () => void }) {
  const { state, refresh } = useWorkspace(initial);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(active);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const job = state.jobs.find((item) => item.job_version_id === jobVersionId);
  const tasks = useMemo(() => state.tasks.filter((item) => item.job_version_id === jobVersionId), [jobVersionId, state.tasks]);
  const currentTask = tasks.at(-1);

  async function startConversation() {
    setBusy(true);
    setBlockers([]);
    setNotice("");
    const result = await callApi<{ started: boolean; running: boolean }>("/api/a2a/chat", { job_version_id: jobVersionId });
    if (result.ok) {
      setStarted(true);
      setNotice(result.data.started ? "A2A 对话已开始，正在等待双方 Agent 轮流交流。" : "上一轮 A2A 仍在处理中。");
      await refresh();
    } else setBlockers(result.blockers);
    setBusy(false);
  }

  useEffect(() => {
    if (!started || !state.a2a_running) return;
    const timer = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(timer);
  }, [refresh, started, state.a2a_running]);

  if (!job) return <Notice tone="warn">岗位不存在或已下架。</Notice>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold tracking-[0.15em] text-indigo-600 uppercase">A2A 对话</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{job.title}</h2><p className="mt-1 text-sm text-slate-500">{job.company_name} · 求职者 Agent ↔ 岗位 Agent</p></div>
        {embedded && onClose ? <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">返回岗位详情</button> : <Link href="/app/candidate/explore" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">返回求职广场</Link>}
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(36,48,86,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-7"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /><span className="text-sm font-semibold text-slate-900">对话房间</span><Badge tone="neutral">{tasks.length} 轮历史</Badge></div><Button onClick={() => void startConversation()} busy={busy} disabled={state.a2a_running}>再次开始一轮</Button></div>
        {notice && <div className="border-b border-slate-100 px-5 py-3 sm:px-7"><Notice tone="info">{notice}</Notice></div>}
        <div className="space-y-4 px-5 py-6 sm:px-7">
          {!currentTask && <div className="rounded-2xl bg-slate-50 p-8 text-center"><p className="text-base font-semibold text-slate-900">还没有对话记录</p><p className="mt-2 text-sm text-slate-500">点击上方按钮，让双方 Agent 先聊清楚岗位与证据。</p><Button onClick={() => void startConversation()} busy={busy} className="mt-5">开始 A2A 对话</Button></div>}
          {currentTask && <>
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"><div><p className="text-sm font-semibold text-slate-900">本轮对话</p><p className="mt-1 text-xs text-slate-500">{currentTask.messages.length} 条消息 · {currentTask.artifacts.length} 个结果</p></div><Badge tone={currentTask.state === "TASK_STATE_COMPLETED" ? "good" : "accent"}>{stateText(currentTask.state)}</Badge></div>
            <div className="space-y-3">{currentTask.messages.map((message) => { const candidate = message.role === "user"; return <div key={message.envelope.message_id} className={`flex ${candidate ? "justify-start" : "justify-end"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 ${candidate ? "rounded-tl-md bg-slate-100 text-slate-800" : "rounded-tr-md bg-indigo-600 text-white"}`}><p className={`mb-1 text-[11px] font-medium ${candidate ? "text-slate-500" : "text-indigo-100"}`}>{candidate ? "求职者 Agent" : "岗位 Agent"}</p><p className="whitespace-pre-line text-sm leading-6">{message.text}</p></div></div>; })}</div>
            {currentTask.artifacts.length > 0 && <details className="rounded-2xl border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-800">查看本轮匹配结果</summary><div className="mt-3 space-y-2 text-sm text-slate-600">{currentTask.artifacts.map((artifact) => <div key={artifact.artifact_id}><p className="font-medium text-slate-900">{artifact.name}</p><p className="mt-1 whitespace-pre-line leading-6">{artifact.description}</p></div>)}</div></details>}
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-800">真人参与</p><p className="mt-1 text-xs leading-5 text-slate-500">下一步可在这条 Task 上加入求职者或招聘方真人，继续补充问题与确认结果。</p><Button variant="secondary" disabled className="mt-3">加入本轮对话 · 即将开放</Button></div>
          </>}
        </div>
        <Blockers items={blockers} />
      </section>
    </div>
  );
}
