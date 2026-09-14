import Link from "next/link";
import { Badge, Notice, Panel } from "@/components/ui";
import type { WorkspaceState } from "@/lib/client/types";
import { AGENT_SUGGESTION_TEXT } from "@/lib/schema/enums";

type Role = "candidate" | "employer";

const roleCopy = {
  candidate: {
    eyebrow: "CANDIDATE SPACE",
    title: "先让 Agent 认识你",
    description: "确认材料，发布 Agent，去和岗位 Agent 聊一聊。",
    accent: "bg-indigo-600 text-white",
    soft: "border-indigo-200 bg-indigo-50",
  },
  employer: {
    eyebrow: "EMPLOYER SPACE",
    title: "先让岗位 Agent 说清楚",
    description: "创建岗位 Agent，发布到广场，等候有证据的对话。",
    accent: "bg-slate-950 text-white",
    soft: "border-slate-300 bg-slate-50",
  },
} as const;

function StepCard({
  index,
  title,
  detail,
  href,
  complete,
  tone,
}: {
  index: string;
  title: string;
  detail: string;
  href: string;
  complete: boolean;
  tone: "indigo" | "slate";
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-32 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold ${
            tone === "indigo" ? "bg-indigo-600 text-white" : "bg-slate-900 text-white"
          }`}
        >
          {index}
        </span>
        <Badge tone={complete ? "good" : "neutral"}>{complete ? "已完成" : "开始"}</Badge>
      </div>
      <div className="mt-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
      <span className="mt-4 text-sm font-medium text-indigo-700 transition-transform group-hover:translate-x-1">
        进入 <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

export function RoleHub({ role, initial }: { role: Role; initial: WorkspaceState }) {
  const copy = roleCopy[role];
  const confirmedJobs = initial.jobs.filter((job) => job.confirmed);
  const candidateReady = Boolean(initial.candidate_agent && initial.disclosure_confirmed);
  const published = role === "candidate"
    ? initial.candidate_marketplace_posts.some((post) => post.published)
    : initial.jobs.some((job) => job.confirmed && job.published);

  return (
    <div className="space-y-5">
      <section className={`rounded-3xl p-5 sm:p-7 ${copy.accent}`}>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-white/60 uppercase">
          {copy.eyebrow}
        </p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">{copy.description}</p>
          </div>
          <Badge tone="demo">演示空间</Badge>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {role === "candidate" ? (
          <>
            <StepCard index="01" title="建立我的 Agent" detail="材料与面试回答，由你确认后生成。" href="/candidate/materials" complete={initial.candidate.materials_confirmed} tone="indigo" />
            <StepCard index="02" title="发布到求职广场" detail="编辑求职卡，确认后公开展示。" href="/candidate/publish" complete={published} tone="indigo" />
            <StepCard index="03" title="成长教练" detail="看懂岗位对话，把差距变成下一步。" href="/coach" complete={initial.reports.length > 0} tone="indigo" />
          </>
        ) : (
          <>
            <StepCard index="01" title="生成招聘 Agent" detail="描述岗位，确认能力模型。" href="/employer/job" complete={confirmedJobs.length > 0} tone="slate" />
            <StepCard index="02" title="发布岗位 Agent" detail="确认后把岗位放进求职广场。" href="/employer/manage" complete={published} tone="slate" />
            <StepCard index="03" title="招聘方管理" detail="管理岗位 Agent，查看对话与真人决策。" href="/employer/manage" complete={initial.decisions.length > 0} tone="slate" />
          </>
        )}
      </div>

      {role === "candidate" ? (
        <Panel
          title="我的 Agent"
          subtitle={candidateReady ? "已准备好进入求职广场。" : "完成材料确认后，这里会出现你的 Agent。"}
          aside={<Link href="/candidate/manage" className="text-sm font-medium text-indigo-700">进入管理 →</Link>}
        >
          {candidateReady ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{initial.candidate_agent?.agent_card_name}</p>
                <p className="mt-1 text-xs text-slate-500">已确认材料 · 已确认披露范围</p>
              </div>
              <Link href="/marketplace" className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500">去找岗位</Link>
            </div>
          ) : (
            <Notice tone="neutral">从材料开始，先确认事实和分享范围。</Notice>
          )}
        </Panel>
      ) : (
        <Panel title="已发布岗位" subtitle="岗位 Agent 出现在求职广场后，候选人可以开始对话。">
          <div className="grid gap-2 sm:grid-cols-3">
            {confirmedJobs.filter((job) => job.published).map((job) => (
              <Link key={job.job_version_id} href={`/marketplace?job=${job.job_version_id}`} className="rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:bg-indigo-50">
                <p className="text-xs text-slate-500">{job.company_name}</p>
                <p className="mt-1 font-medium text-slate-900">{job.title}</p>
              </Link>
            ))}
            {confirmedJobs.every((job) => !job.published) && <p className="text-sm text-slate-500">还没有公开岗位，去管理页发布第一个岗位 Agent。</p>}
          </div>
        </Panel>
      )}

      <div className={`rounded-2xl border p-4 ${copy.soft}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{role === "candidate" ? "已经有岗位在等你" : "想看完整判断过程"}</p>
            <p className="mt-1 text-xs text-slate-500">{role === "candidate" ? "打开求职广场，先看岗位，再决定是否聊天。" : "进入招聘方管理，查看 Agent 对话和真人决策。"}</p>
          </div>
          <Link href={role === "candidate" ? "/marketplace" : "/employer/manage"} className="shrink-0 rounded-xl bg-white px-4 py-2 text-center text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300">
            {role === "candidate" ? "打开求职广场" : "进入招聘方管理"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function suggestionText(value: string | undefined) {
  return value && value in AGENT_SUGGESTION_TEXT
    ? AGENT_SUGGESTION_TEXT[value as keyof typeof AGENT_SUGGESTION_TEXT]
    : "等待评估";
}
