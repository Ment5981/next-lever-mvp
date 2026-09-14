import Link from "next/link";
import { Badge, Panel, Stat } from "@/components/ui";
import type { WorkspaceState } from "@/lib/client/types";

type Role = "candidate" | "employer";

export function WorkbenchHub({ role, initial }: { role: Role; initial: WorkspaceState }) {
  const candidateCards = [
    { title: "材料与面试", detail: "确认事实和回答", href: "/candidate/materials", count: initial.candidate.evidence.length },
    { title: "我的 Agent", detail: "设置披露范围", href: "/candidate/agent", count: initial.candidate_agent ? 1 : 0 },
    { title: "A2A 对话", detail: "查看申请和消息", href: "/a2a", count: initial.tasks.length },
    { title: "成长报告", detail: "反馈与下一步", href: "/growth", count: initial.reports.length },
  ];
  const employerCards = [
    { title: "岗位 Agent", detail: "编辑能力模型", href: "/employer/job", count: initial.jobs.filter((job) => job.confirmed).length },
    { title: "A2A 对话", detail: "查看消息和产物", href: "/a2a", count: initial.tasks.length },
    { title: "候选人收件箱", detail: "完成真人决策", href: "/employer/inbox", count: initial.decisions.length },
  ];
  const cards = role === "candidate" ? candidateCards : employerCards;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="岗位" value={initial.jobs.length} />
        <Stat label="A2A Task" value={initial.tasks.length} />
        <Stat label={role === "candidate" ? "成长报告" : "真人决策"} value={role === "candidate" ? initial.reports.length : initial.decisions.length} />
      </div>
      <Panel title={role === "candidate" ? "求职者管理" : "招聘方管理"} subtitle="需要调整或查看时，再打开对应模块。">
        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="group flex items-center justify-between rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-sm">
              <div><p className="font-medium text-slate-950">{card.title}</p><p className="mt-1 text-xs text-slate-500">{card.detail}</p></div>
              <div className="flex items-center gap-3"><Badge tone="neutral">{card.count}</Badge><span className="text-lg text-slate-400 transition-transform group-hover:translate-x-1">→</span></div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
