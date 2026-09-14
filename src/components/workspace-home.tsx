import Link from "next/link";
import { Badge, Panel, Stat } from "@/components/ui";
import { DemoFillButton } from "@/components/demo-fill-button";
import type { WorkspaceState } from "@/lib/client/types";
import type { WorkspaceRole } from "@/lib/auth/roles";

const candidateActions = [
  { href: "/app/candidate/resume", label: "建立我的 Agent", detail: "补充材料，确认你的经历" },
  { href: "/app/candidate/explore", label: "进入求职广场", detail: "看看谁正在寻找你" },
  { href: "/app/candidate/path", label: "查看进阶路径", detail: "把反馈变成下一步" },
];

const employerActions = [
  { href: "/app/employer/jobs", label: "建立岗位 Agent", detail: "说清楚岗位真正需要什么" },
  { href: "/app/employer/talent", label: "进入求职广场", detail: "先看 Agent，再开始对话" },
  { href: "/app/employer/jobs", label: "管理我的智能体", detail: "检查对话，做出判断" },
];

export function WorkspaceHome({ role, initial }: { role: WorkspaceRole; initial: WorkspaceState }) {
  const candidateReady = Boolean(initial.candidate_agent && initial.disclosure_confirmed);
  const publishedJobs = initial.jobs.filter((job) => job.published).length;
  const publishedCandidates = initial.candidate_marketplace_posts.filter((post) => post.published).length;
  const actions = role === "candidate" ? candidateActions : employerActions;
  const stats = role === "candidate"
    ? [["已确认材料", initial.candidate.materials_confirmed ? "已完成" : "待完成"], ["已沟通岗位", String(initial.tasks.length)], ["待执行任务", String(initial.reports.at(-1)?.growth_tasks.length ?? 0)]]
    : [["已发布岗位", String(publishedJobs)], ["候选人对话", String(initial.tasks.length)], ["待确认决策", String(initial.assessments.length - initial.decisions.length)]];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.15)] sm:px-9 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <Badge tone="demo">演示空间</Badge>
          <h1 className="mt-5 max-w-3xl text-balance text-3xl leading-[1.08] font-semibold tracking-[-0.05em] sm:text-5xl">
            {role === "candidate" ? <><span className="block sm:whitespace-nowrap">让 Agent 先聊清岗位，</span><span className="block sm:whitespace-nowrap">再把差距变成下一步。</span></> : <><span className="block sm:whitespace-nowrap">让岗位先把真正的需求</span><span className="block sm:whitespace-nowrap">说清楚。</span></>}
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">{role === "candidate" ? "从真实材料出发，和岗位 Agent 对话，找到下一步。" : "从公司与岗位信息开始，生成可以持续沟通的岗位 Agent。"}</p>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full border-[34px] border-indigo-400/20" />
        <div className="pointer-events-none absolute -bottom-28 right-24 size-64 rounded-full border-[24px] border-fuchsia-400/15" />
      </section>

      <div className="grid gap-3 sm:grid-cols-3">{stats.map(([label, value]) => <Stat key={label} label={label} value={value} />)}</div>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.16em] text-indigo-600 uppercase">现在开始</p><h2 className="mt-1 text-xl font-semibold tracking-tight">下一步做什么？</h2></div><DemoFillButton /></div>
        <div className="grid gap-3 md:grid-cols-3">{actions.map((action, index) => <Link key={action.href} href={action.href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-slate-200/60"><div className="flex items-center justify-between"><span className="grid size-8 place-items-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-700">{index + 1}</span><span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600">→</span></div><h3 className="mt-7 text-base font-semibold">{action.label}</h3><p className="mt-2 text-sm text-slate-500">{action.detail}</p></Link>)}</div>
      </section>

      <Panel title={role === "candidate" ? "我的空间" : "招聘空间"} subtitle={role === "candidate" ? "材料、对话和成长任务都从这里继续。" : "岗位、候选人和真人决策都从这里继续。"}>
        <div className="grid gap-3 sm:grid-cols-2">{role === "candidate" ? <><QuickLink href="/app/candidate/resume" title="简历与 Agent" state={candidateReady ? "已准备好" : "还没完成"} /><QuickLink href="/app/candidate/applications" title="求职记录" state={`${initial.tasks.length} 段对话`} /></> : <><QuickLink href="/app/employer/jobs" title="我的智能体" state={`${publishedCandidates} 位候选人可见`} /><QuickLink href="/app/employer/jobs" title="对话与决策" state={`${initial.decisions.length} 条已确认`} /></>}</div>
      </Panel>
    </div>
  );
}

function QuickLink({ href, title, state }: { href: string; title: string; state: string }) {
  return <Link href={href} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"><span className="text-sm font-medium">{title}</span><span className="text-xs text-slate-400">{state} ·</span></Link>;
}
