"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import { Badge, Notice, Panel } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { stateText } from "@/lib/a2a/protocol";
import { suggestionText } from "@/components/role-hub";

export function Marketplace({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [selectedId, setSelectedId] = useState(initial.jobs[0]?.job_version_id ?? "");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const selected = useMemo(() => state.jobs.find((job) => job.job_version_id === selectedId) ?? state.jobs[0], [selectedId, state.jobs]);
  const task = selected ? state.tasks.find((item) => item.job_version_id === selected.job_version_id) : undefined;
  const assessment = selected ? state.assessments.find((item) => item.job_version_id === selected.job_version_id) : undefined;

  async function runConversation() {
    setBusy(true);
    setNotice("");
    setError("");
    const result = await callApi<{ tasks: { task_id: string }[] }>("/api/demo/run", {});
    if (result.ok) {
      setNotice("对话已完成，反馈已经回到你的 Agent。\n");
      await refresh();
    } else {
      setError(result.blockers.join("、"));
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="accent">招聘 Agent</Badge>
          <span className="text-xs text-slate-400">{state.jobs.length} 个岗位</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/candidate" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-indigo-300">我的 Agent</Link>
          <Link href="/employer" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-indigo-300">发布岗位</Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <Panel title="岗位 Agent" subtitle="先看方向，再决定是否开始对话。">
          <div className="space-y-2">
            {state.jobs.map((job) => {
              const jobAssessment = state.assessments.find((item) => item.job_version_id === job.job_version_id);
              const active = job.job_version_id === selected?.job_version_id;
              return (
                <button key={job.job_version_id} type="button" onClick={() => setSelectedId(job.job_version_id)} className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-white hover:border-indigo-300"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-slate-500">{job.company_name}</p>
                      <p className="mt-1 truncate font-medium text-slate-900">{job.title}</p>
                    </div>
                    {jobAssessment && <Badge tone={jobAssessment.suggestion === "recommend_interview" ? "good" : jobAssessment.suggestion === "human_review_required" ? "warn" : "neutral"}>{suggestionText(jobAssessment.suggestion)}</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={selected ? selected.title : "选择一个岗位"} subtitle={selected ? selected.company_name : ""}>
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-xs text-white/50">岗位 Agent 的一句话</p>
                <p className="mt-2 text-lg leading-8">{selected.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.criteria.slice(0, 3).map((criterion) => <span key={criterion.criterion_id} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">{criterion.name}</span>)}
                </div>
              </div>

              {assessment && (
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">匹配度</p><p className="mt-1 text-xl font-semibold text-slate-950">{assessment.soft_match_score.toFixed(0)}<span className="text-sm font-normal text-slate-400"> / 100</span></p></div>
                  <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">Agent 建议</p><p className="mt-1 font-semibold text-slate-950">{suggestionText(assessment.suggestion)}</p></div>
                  <div className="rounded-xl border border-slate-200 p-3"><p className="text-xs text-slate-500">对话状态</p><p className="mt-1 font-semibold text-slate-950">{task ? stateText(task.state) : "未开始"}</p></div>
                </div>
              )}

              {task ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">最近的对话</p><Link href="/a2a" className="text-xs text-indigo-700">查看完整时间线 →</Link></div>
                  {task.messages.slice(-3).map((message) => <div key={message.envelope.message_id} className={`rounded-xl p-3 text-sm leading-6 ${message.role === "agent" ? "bg-slate-100 text-slate-700" : "bg-indigo-50 text-indigo-950"}`}><p className="mb-1 text-xs font-medium text-slate-400">{message.role === "agent" ? "岗位 Agent" : "求职者 Agent"}</p>{message.text}</div>)}
                </div>
              ) : (
                <Notice tone="neutral">这是一张岗位 Agent 卡片。完成授权后，才能开始真实申请与对话。</Notice>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={runConversation} busy={busy}>体验一场对话</Button>
                <Link href="/candidate/agent" className="text-sm text-indigo-700 underline underline-offset-2">确认我的分享范围</Link>
              </div>
              {notice && <Notice tone="good">{notice}</Notice>}
              {error && <Notice tone="warn">{error}</Notice>}
            </div>
          ) : <Notice tone="neutral">暂时没有可浏览的岗位 Agent。</Notice>}
        </Panel>
      </div>
    </div>
  );
}
