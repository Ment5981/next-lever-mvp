"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { Badge, Blockers, Notice, Panel } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import type { JobVersion } from "@/lib/schema/domain";

/** 招聘方岗位 Agent 独立编辑页：保存时追加岗位新版本。 */
export function EmployerAgentEditor({ initial, jobVersionId }: { initial: WorkspaceState; jobVersionId: string }) {
  const { state, refresh } = useWorkspace(initial);
  const current = state.jobs.find((job) => job.job_version_id === jobVersionId) ?? null;
  const [title, setTitle] = useState(current?.title ?? "");
  const [summary, setSummary] = useState(current?.summary ?? "");
  const [notice, setNotice] = useState("");
  const [blockers, setBlockers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!current) return;
    setBusy(true);
    setNotice("");
    const result = await callApi<{ job: JobVersion; note: string }>("/api/employer/job/edit", { job_version_id: current.job_version_id, title, summary });
    if (result.ok) {
      setBlockers([]);
      setNotice(`${result.data.note}，${result.data.job.published ? "已继续公开" : "仍未公开"}。`);
      await refresh();
    } else setBlockers(result.blockers);
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <Panel title="编辑岗位 Agent" subtitle="修改会生成新版本，旧版本和历史对话仍会保留。" aside={<Badge tone={current?.published ? "good" : "warn"}>{current?.published ? "已发布" : "未发布"}</Badge>}>
        {!current ? <Notice tone="warn">岗位版本不存在，请从招聘方管理重新进入。</Notice> : <div className="space-y-5">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">当前岗位</p><p className="mt-1 text-sm font-medium text-slate-900">{current.company_name} · v{current.version}</p></div>
          <label className="block"><span className="text-sm font-medium text-slate-800">岗位标题</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          <label className="block"><span className="text-sm font-medium text-slate-800">岗位 Agent 核心描述</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={6} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-medium text-slate-900">Agent 仍会保留</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">能力模型 {current.criteria.length} 项</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">证据评估规则</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">岗位发布状态</span></div></div>
          {notice && <Notice tone="good">{notice}</Notice>}<Blockers items={blockers} /><div className="flex flex-wrap gap-2"><Button onClick={save} busy={busy}>保存为新版本</Button><Link href="/employer/manage" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">返回管理</Link></div>
        </div>}
      </Panel>
    </div>
  );
}
