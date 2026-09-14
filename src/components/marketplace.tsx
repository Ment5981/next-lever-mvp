"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { A2AConversation } from "@/components/a2a/conversation";
import { Button } from "@/components/button";
import { Badge, Notice } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import type { CandidateMarketplacePost } from "@/lib/schema/domain";
import { stateText } from "@/lib/a2a/protocol";
import { suggestionText } from "@/components/role-hub";
import { ZhihuCareerFeed } from "@/components/zhihu-career-feed";
import {
  ACTIVITY_LISTINGS,
  CANDIDATE_LISTINGS,
  EXTRA_JOB_LISTINGS,
  JOB_MARKET_INFO,
  MARKET_IMAGES,
  type ActivityListing,
  type CandidateListing,
  type JobMarketInfo,
} from "@/lib/demo/marketplace-data";

type Job = WorkspaceState["jobs"][number];
type Assessment = WorkspaceState["assessments"][number];
type JobListing = {
  id: string;
  realJobVersionId?: string;
  company: string;
  job: Job | null;
  info: JobMarketInfo;
};

type MarketplaceTab = "jobs" | "candidates" | "activities" | "zhihu";

const FALLBACK_INFO: JobMarketInfo = {
  title: "AI 应用产品经理",
  subtitle: "和岗位 Agent 对话，了解真实要求",
  image: MARKET_IMAGES.research,
  location: "地点待确认",
  salary: "薪资待沟通",
  experience: "经验不限",
  education: "学历不限",
  industry: "人工智能",
  size: "规模待确认",
  stage: "阶段待确认",
  recruiter: "招聘方 Agent",
  recruiterRole: "岗位负责人",
  benefits: ["岗位详情由招聘方补充"],
  responsibilities: ["与招聘方 Agent 对话，进一步了解岗位职责。"],
  requirements: ["以岗位 Agent 发布的能力模型为准。"],
};

function jobListings(state: WorkspaceState): JobListing[] {
  const real = state.jobs.filter((job) => job.published).map((job) => ({
    id: job.job_version_id,
    realJobVersionId: job.job_version_id,
    company: job.company_name,
    job,
    info: JOB_MARKET_INFO[job.job_version_id] ?? {
      ...FALLBACK_INFO,
      title: job.title,
      subtitle: job.summary.slice(0, 80),
      requirements: job.criteria.slice(0, 4).map((criterion) => criterion.description),
      responsibilities: job.criteria.slice(0, 4).map((criterion) => criterion.name),
    },
  }));
  const extra = EXTRA_JOB_LISTINGS.map(({ id, company, ...info }) => ({
    id,
    company,
    job: null,
    info,
  }));
  return [...real, ...extra];
}
function marketplaceCandidates(state: WorkspaceState): CandidateListing[] {
  const published = state.candidate_marketplace_posts.map((post: CandidateMarketplacePost) => ({
    id: post.post_id,
    name: post.display_name,
    role: post.role,
    image: post.image_url || "/images/candidates/candidate-editorial-03.png",
    location: post.location,
    experience: post.experience,
    education: post.education,
    intro: post.intro,
    tags: post.tags,
    projects: post.projects,
    resume: post.resume,
    availability: post.availability,
  }));
  return [...published, ...CANDIDATE_LISTINGS];
}
function Cover({
  index,
  image,
  title,
  label,
}: {
  index: number;
  image: string;
  title: string;
  label: string;
}) {
  const ratio = index % 3 === 1 ? "aspect-[4/5]" : index % 3 === 2 ? "aspect-square" : "aspect-[4/3]";
  return (
    <div className={`relative ${ratio} overflow-hidden rounded-2xl bg-slate-200`}>
      <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${image})` }} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
      <div className="relative z-10 flex h-full flex-col justify-between p-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-slate-900">{label}</span>
          <span className="text-3xl font-semibold tracking-[-0.08em] text-white/80">0{index + 1}</span>
        </div>
        <p className="max-w-[13rem] text-xl leading-tight font-semibold tracking-tight">{title}</p>
      </div>
    </div>
  );
}

function JobCard({ listing, index, assessment, onOpen }: { listing: JobListing; index: number; assessment: Assessment | undefined; onOpen: () => void }) {
  return (
    <article className="mb-5 break-inside-avoid">
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        <Cover index={index} image={listing.info.image} title={listing.info.title} label={listing.info.subtitle} />
        <div className="px-1.5 pt-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 text-[15px] leading-6 font-semibold text-slate-950 group-hover:text-indigo-700">{listing.info.title}</h2>
            {assessment && <Badge tone={assessment.suggestion === "recommend_interview" ? "good" : assessment.suggestion === "human_review_required" ? "warn" : "neutral"}>{suggestionText(assessment.suggestion)}</Badge>}
          </div>
          <p className="mt-1 text-xs text-slate-500">{listing.company} · {listing.info.location}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{listing.info.subtitle}，寻找能把想法推进到结果的人。</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-500"><span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">{listing.info.salary}</span><span className="rounded-full bg-slate-100 px-2 py-1">{listing.info.experience}</span>{listing.job?.hiring_status === "filled" && <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-500">已招满</span>}</div>
        </div>
      </button>
    </article>
  );
}

function CandidateCard({ candidate, index, onOpen }: { candidate: CandidateListing; index: number; onOpen: () => void }) {
  return (
    <article className="mb-5 break-inside-avoid">
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        <Cover index={index} image={candidate.image} title={candidate.role} label="求职者 Agent" />
        <div className="px-1.5 pt-3">
          <h2 className="text-[15px] font-semibold text-slate-950 group-hover:text-indigo-700">{candidate.name} · {candidate.role}</h2>
          <p className="mt-1 text-xs text-slate-500">{candidate.location} · {candidate.experience} · {candidate.education}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{candidate.intro}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{candidate.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{tag}</span>)}</div>
        </div>
      </button>
    </article>
  );
}

function ActivityCard({ activity, index, onOpen }: { activity: ActivityListing; index: number; onOpen: () => void }) {
  return (
    <article className="mb-5 break-inside-avoid">
      <button type="button" onClick={onOpen} className="group block w-full text-left">
        <Cover index={index} image={activity.image} title={activity.title} label={activity.category} />
        <div className="px-1.5 pt-3">
          <div className="flex items-start justify-between gap-2"><h2 className="min-w-0 text-[15px] leading-6 font-semibold text-slate-950 group-hover:text-indigo-700">{activity.title}</h2><Badge tone="demo">活动</Badge></div>
          <p className="mt-1 text-xs text-slate-500">{activity.organizer} · {activity.deadline}</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{activity.subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{activity.fit}</span></div>
        </div>
      </button>
    </article>
  );
}

function JobDetail({ listing, state, task, assessment, busy, notice, error, chatOpen, onClose, onChatClose, onStart }: { listing: JobListing; state: WorkspaceState; task: WorkspaceState["tasks"][number] | undefined; assessment: Assessment | undefined; busy: boolean; notice: string; error: string; chatOpen: boolean; onClose: () => void; onChatClose: () => void; onStart: () => void }) {
  const info = listing.info;
  const candidateReady = Boolean(state.candidate_agent);
  const hiringClosed = listing.job?.hiring_status === "filled";
  if (chatOpen && listing.realJobVersionId) {
    return <Dialog onClose={onChatClose} titleId="a2a-chat-title"><A2AConversation initial={state} jobVersionId={listing.realJobVersionId} embedded active onClose={onChatClose} /></Dialog>;
  }
  return (
    <Dialog onClose={onClose} titleId="job-detail-title">
      <p className="text-xs font-semibold tracking-[0.15em] text-indigo-600 uppercase">岗位 Agent 详情</p>
      <h2 id="job-detail-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{info.title}</h2>
      <p className="mt-1 text-sm text-slate-500">{listing.company} · {info.subtitle}{hiringClosed ? " · 已招满" : ""}</p>
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-4">{[["薪资", info.salary], ["地点", info.location], ["经验", info.experience], ["学历", info.education]].map(([label, value]) => <div key={label} className="bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-950">{value}</p></div>)}</div>
      <div className="mt-5 grid gap-5 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5"><InfoList title="职位介绍" items={["我们正在寻找一位能把用户问题、AI 能力和业务结果连接起来的产品经理。你会和产品、技术、设计以及客户一起，把一个想法推进成真实可用的产品。"]} /><InfoList title="你将负责" items={info.responsibilities} /><InfoList title="我们希望你" items={info.requirements} /></div>
        <aside className="space-y-4"><div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-xs text-white/50">岗位 Agent 重点关注</p><div className="mt-3 flex flex-wrap gap-2">{listing.job?.criteria.slice(0, 5).map((criterion) => <span key={criterion.criterion_id} className="rounded-full bg-white/10 px-2.5 py-1.5 text-xs text-white/75">{criterion.name}</span>) ?? <span className="text-sm text-white/70">演示岗位，详情可继续沟通</span>}</div></div><div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-semibold text-slate-950">职位福利</h3><div className="mt-3 flex flex-wrap gap-2">{info.benefits.map((item) => <span key={item} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{item}</span>)}</div></div><div className="rounded-2xl border border-slate-200 p-4"><p className="text-xs text-slate-500">公司信息</p><p className="mt-2 font-semibold text-slate-950">{listing.company}</p><p className="mt-1 text-xs text-slate-500">{info.industry} · {info.size} · {info.stage}</p><div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">招聘负责人</p><p className="mt-1 text-sm font-medium text-slate-900">{info.recruiter} · {info.recruiterRole}</p></div></div></aside>
      </div>
      {assessment && <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-indigo-950">你的 Agent 已经看过这个岗位</p><Badge tone="accent">{suggestionText(assessment.suggestion)}</Badge></div><p className="mt-2 text-sm leading-6 text-indigo-900">{assessment.suggestion_reason}</p></div>}
      {task && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-emerald-950">已有对话记录</p><Badge tone="good">{stateText(task.state)}</Badge></div><p className="mt-2 text-sm leading-6 text-emerald-900">可以进入独立对话页继续查看，或开启新一轮。</p></div>}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center"><div className="flex gap-2">{listing.realJobVersionId ? hiringClosed ? <Button variant="secondary" disabled>已招满 · 暂停新对话</Button> : candidateReady ? <Button onClick={onStart} busy={busy}>{task ? "再次进入 A2A 对话" : "进入 A2A 对话"}</Button> : <Link href="/candidate/materials" className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500">先建立我的 Agent</Link> : <Button variant="secondary" disabled>演示岗位 · 即将开放</Button>}<button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300">稍后再看</button></div>{notice && <Notice tone="good">{notice}</Notice>}{error && <Notice tone="warn">{error}</Notice>}</div>
    </Dialog>
  );
}

function CandidateDetail({ candidate, onClose }: { candidate: CandidateListing; onClose: () => void }) {
  return <Dialog onClose={onClose} titleId="candidate-detail-title"><p className="text-xs font-semibold tracking-[0.15em] text-indigo-600 uppercase">求职者 Agent 详情</p><h2 id="candidate-detail-title" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{candidate.name} · {candidate.role}</h2><p className="mt-1 text-sm text-slate-500">{candidate.location} · {candidate.availability}</p><div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-3">{[["经验", candidate.experience], ["学历", candidate.education], ["位置", candidate.location]].map(([label, value]) => <div key={label} className="bg-white p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-950">{value}</p></div>)}</div><div className="mt-5 rounded-2xl bg-indigo-50 p-4"><p className="text-xs font-semibold text-indigo-600">Agent 自我介绍</p><p className="mt-2 text-sm leading-7 text-indigo-950">{candidate.intro}</p><div className="mt-3 flex flex-wrap gap-2">{candidate.tags.map((tag) => <span key={tag} className="rounded-full bg-white px-2.5 py-1.5 text-xs text-indigo-700">{tag}</span>)}</div></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><InfoList title="履历摘要" items={candidate.resume} /><InfoList title="项目经历" items={candidate.projects} /></div><div className="mt-6 flex gap-2"><Button variant="secondary" disabled>演示 Agent · 仅供预览</Button><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">关闭</button></div></Dialog>;
}

function ActivityDetail({ activity, onClose }: { activity: ActivityListing; onClose: () => void }) {
  return <Dialog onClose={onClose} titleId="activity-detail-title"><div className="flex items-center gap-2"><Badge tone="demo">{activity.category}</Badge><span className="text-xs text-slate-500">活动信息以官方页面为准</span></div><h2 id="activity-detail-title" className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{activity.title}</h2><p className="mt-1 text-sm text-slate-500">{activity.organizer} · {activity.format} · {activity.location}</p><div className="mt-5 rounded-2xl bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-950">为什么适合你</p><p className="mt-2 text-sm leading-7 text-emerald-900">{activity.fit}</p></div><div className="mt-5 space-y-5"><InfoList title="活动内容" items={[activity.description]} /><InfoList title="建议产出" items={activity.deliverables} /></div><div className="mt-6 flex flex-wrap gap-2"><a href={activity.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">查看活动页面</a><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">稍后再看</button></div></Dialog>;
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="text-base font-semibold text-slate-950">{title}</h3><ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />{item}</li>)}</ul></div>;
}

function Dialog({ onClose, titleId, children }: { onClose: () => void; titleId: string; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-7"><div className="flex justify-end"><button type="button" onClick={onClose} aria-label="关闭" className="grid size-9 place-items-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200">×</button></div>{children}</section></div>;
}

export function Marketplace({ initial, mode = "candidate" }: { initial: WorkspaceState; mode?: "candidate" | "employer" }) {
  const { state, refresh } = useWorkspace(initial);
  const searchParams = useSearchParams();
  const [tabOverride, setTabOverride] = useState<MarketplaceTab | null>(null);
  const requestedTab = searchParams.get("tab");
  const tab = tabOverride ?? (requestedTab === "candidates" || requestedTab === "activities" || requestedTab === "zhihu" ? requestedTab : "jobs");
  const queryJobId = searchParams.get("job");
  const [selectedJobId, setSelectedJobId] = useState<string | null>(queryJobId);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const jobs = jobListings(state);
  const candidates = useMemo(() => marketplaceCandidates(state), [state]);
  const selectedJob = useMemo(() => jobs.find((listing) => listing.id === selectedJobId) ?? null, [jobs, selectedJobId]);
  const selectedCandidate = candidates.find((candidate) => candidate.id === selectedCandidateId) ?? null;
  const selectedActivity = ACTIVITY_LISTINGS.find((activity) => activity.id === selectedActivityId) ?? null;

  const task = selectedJob?.realJobVersionId ? state.tasks.find((item) => item.job_version_id === selectedJob.realJobVersionId) : undefined;
  const assessment = selectedJob?.realJobVersionId ? state.assessments.find((item) => item.job_version_id === selectedJob.realJobVersionId) : undefined;
  const authorized = Boolean(selectedJob?.realJobVersionId && state.authorizations.some((item) => item.job_version_ids.includes(selectedJob.realJobVersionId!)));

  async function startA2A() {
    if (!selectedJob?.realJobVersionId) return;
    setBusy(true); setError(""); setNotice("");
    if (!state.candidate_agent) { setError("先建立你的求职者 Agent，再开始 A2A 对话。"); setBusy(false); return; }
    if (!authorized) {
      const auth = await callApi("/api/authorize", { job_version_ids: [selectedJob.realJobVersionId], acknowledged_job_count: 1 });
      if (!auth.ok) { setError(auth.blockers.join("、")); setBusy(false); return; }
    }
    const result = await callApi<{ started: boolean; running: boolean }>("/api/a2a/chat", { job_version_id: selectedJob.realJobVersionId });
    if (result.ok) {
      await refresh();
      setChatOpen(true);
    } else setError(result.blockers.join("、"));
    setBusy(false);
  }

  const allTabItems: { id: MarketplaceTab; label: string; count: number }[] = [
    { id: "jobs", label: "岗位 Agent", count: jobs.length },
    { id: "candidates", label: "求职者 Agent", count: candidates.length },
    { id: "activities", label: "成长活动", count: ACTIVITY_LISTINGS.length },
    { id: "zhihu", label: "知乎经验", count: 8 },
  ];
  const tabItems = allTabItems;
  const zhihuContent = <div className={tab === "zhihu" ? "" : "hidden"}><ZhihuCareerFeed /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Badge tone="accent">求职广场</Badge><span className="text-xs text-slate-400">岗位、求职者、活动和经验</span></div>
          <p className="mt-2 text-sm text-slate-500">{mode === "employer" ? "浏览公开 Agent，找到合适的下一次对话。" : "先看清楚，再开始一段 Agent 对话或一次真实实践。"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "candidate" && <Link href="/app/candidate/agent" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-indigo-300">管理 Agent</Link>}
          {mode === "candidate" && <Link href="/app/candidate/agent" className="rounded-xl bg-pink-500 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-pink-200 hover:bg-pink-600">发布我的 Agent</Link>}
          {mode === "employer" && <Link href="/app/employer/jobs#publish-job" className="rounded-xl bg-pink-500 px-3 py-2 text-sm font-medium text-white shadow-sm shadow-pink-200 hover:bg-pink-600">发布岗位</Link>}
        </div>
      </div>
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {tabItems.map((item) => <button key={item.id} type="button" onClick={() => setTabOverride(item.id)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${tab === item.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{item.label}<span className="ml-1 text-xs text-slate-400">{item.count}</span></button>)}
      </div>
      {zhihuContent}
      {tab === "jobs" && <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">{jobs.map((listing, index) => <JobCard key={listing.id} listing={listing} index={index} assessment={listing.realJobVersionId ? state.assessments.find((item) => item.job_version_id === listing.realJobVersionId) : undefined} onOpen={() => { setSelectedJobId(listing.id); setChatOpen(false); setError(""); setNotice(""); }} />)}</div>}
      {tab === "candidates" && <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">{candidates.map((candidate, index) => <CandidateCard key={candidate.id} candidate={candidate} index={index} onOpen={() => setSelectedCandidateId(candidate.id)} />)}</div>}
      {tab === "activities" && <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">{ACTIVITY_LISTINGS.map((activity, index) => <ActivityCard key={activity.id} activity={activity} index={index} onOpen={() => setSelectedActivityId(activity.id)} />)}</div>}
      <p className="pt-2 text-center text-xs text-slate-400">点击卡片，查看详情</p>
      {selectedJob && <JobDetail listing={selectedJob} state={state} task={task} assessment={assessment} busy={busy} notice={notice} error={error} chatOpen={chatOpen} onClose={() => { setChatOpen(false); setSelectedJobId(null); }} onChatClose={() => setChatOpen(false)} onStart={startA2A} />}
      {selectedCandidate && <CandidateDetail candidate={selectedCandidate} onClose={() => setSelectedCandidateId(null)} />}
      {selectedActivity && <ActivityDetail activity={selectedActivity} onClose={() => setSelectedActivityId(null)} />}
    </div>
  );
}
