"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { Badge, Blockers, Notice, Panel } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import type { JobVersion } from "@/lib/schema/domain";

/** 招聘方已发布岗位的轻量管理：发布状态、招聘状态和版本入口。 */
export function EmployerAgentManagement({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [blockers, setBlockers] = useState<string[]>([]);

  async function updatePublication(job: JobVersion) {
    setBusyId(`${job.job_version_id}:publication`);
    setNotice("");
    const result = await callApi<{ job: JobVersion }>("/api/employer/job/publish", {
      job_version_id: job.job_version_id,
      published: !job.published,
    });
    if (result.ok) {
      setBlockers([]);
      setNotice(result.data.job.published ? `${job.title} 已发布到求职广场。` : `${job.title} 已从求职广场撤下。`);
      await refresh();
    } else setBlockers(result.blockers);
    setBusyId(null);
  }

  async function updateHiringStatus(job: JobVersion, hiring_status: "hiring" | "filled") {
    setBusyId(`${job.job_version_id}:status`);
    setNotice("");
    const result = await callApi<{ job: JobVersion }>("/api/employer/job/status", {
      job_version_id: job.job_version_id,
      hiring_status,
    });
    if (result.ok) {
      setBlockers([]);
      setNotice(`${job.title} 已更新为${hiring_status === "filled" ? "已招满" : "招聘中"}。`);
      await refresh();
    } else setBlockers(result.blockers);
    setBusyId(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">岗位 Agent</p><p className="mt-2 text-2xl font-semibold text-slate-950">{state.jobs.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">已发布</p><p className="mt-2 text-2xl font-semibold text-indigo-600">{state.jobs.filter((job) => job.published).length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">A2A 对话</p><p className="mt-2 text-2xl font-semibold text-slate-950">{state.tasks.length}</p></div>
      </div>

      <Panel title="我的岗位 Agent" subtitle="发布后才会出现在求职广场；招满后可暂停新对话。">
        {notice && <Notice tone="good">{notice}</Notice>}
        <Blockers items={blockers} />
        <div className="space-y-3">
          {state.jobs.map((job) => {
            const publicationBusy = busyId === `${job.job_version_id}:publication`;
            const statusBusy = busyId === `${job.job_version_id}:status`;
            return (
              <article key={job.job_version_id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Badge tone="neutral">v{job.version}</Badge><Badge tone={job.published ? "good" : "warn"}>{job.published ? "已发布" : "未发布"}</Badge><Badge tone={job.hiring_status === "filled" ? "neutral" : "accent"}>{job.hiring_status === "filled" ? "已招满" : "招聘中"}</Badge></div>
                    <h2 className="mt-2 font-semibold text-slate-950">{job.company_name} · {job.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{job.summary}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant={job.published ? "secondary" : "primary"} onClick={() => updatePublication(job)} busy={publicationBusy}>{job.published ? "撤下" : "发布到广场"}</Button>
                    <Link href={`/employer/agent/edit/${job.job_version_id}`} className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300">编辑 Agent</Link>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">接收状态</span>
                  <Button variant={job.hiring_status === "hiring" ? "primary" : "secondary"} className="min-h-8 px-3 py-1 text-xs" onClick={() => updateHiringStatus(job, "hiring")} busy={statusBusy && job.hiring_status !== "hiring"} disabled={job.hiring_status === "hiring"}>招聘中</Button>
                  <Button variant={job.hiring_status === "filled" ? "danger" : "secondary"} className="min-h-8 px-3 py-1 text-xs" onClick={() => updateHiringStatus(job, "filled")} busy={statusBusy && job.hiring_status !== "filled"} disabled={job.hiring_status === "filled"}>已招满</Button>
                  <Link href={`/marketplace?job=${job.job_version_id}`} className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-800">查看岗位卡 →</Link>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2"><Link href="/employer/inbox" className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white">查看候选人对话</Link><Link href="/a2a" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">查看 A2A 时间线</Link></div>
    </div>
  );
}
