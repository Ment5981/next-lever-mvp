import Link from "next/link";
import { HomePreview } from "@/components/home-preview";
import { Nav } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";
import { ZhihuHotList } from "@/components/zhihu-hot-list";
import { ACTIVITY_LISTINGS } from "@/lib/demo/marketplace-data";

export const dynamic = "force-dynamic";

export default function Home() {
  const snapshot = workspaceSnapshot();
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Nav />
      <main className="flex-1">
        <section className="stage-grid relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/next-level-cover.png')" }} />
          <div className="pointer-events-none absolute inset-0 bg-white/65" />
          <div className="relative mx-auto grid max-w-6xl gap-9 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-indigo-600 uppercase">AI AGENT × JOB GROWTH</p>
              <h1 className="mt-4 text-5xl leading-[0.98] font-semibold tracking-[-0.05em] text-slate-950 sm:text-7xl">Next Level</h1>
              <p className="mt-5 max-w-xl text-xl leading-9 text-slate-700 sm:text-2xl">投递有回音，努力有方向。</p>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">让求职者 Agent 与岗位 Agent 先聊清楚，再把真实反馈变成能力提升。</p>
              <Link href="/onboarding/role?role=candidate&next=/app/candidate/explore" className="group mt-7 flex max-w-lg items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ec4899_0%,#f472b6_100%)] px-4 py-4 text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-300">
                <span className="text-base font-semibold tracking-tight">开始探索 <span className="ml-1 transition-transform group-hover:translate-x-1">→</span></span>
              </Link>
            </div>
            <HomePreview initial={snapshot} />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-indigo-600 uppercase">HOW IT WORKS</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">从岗位匹配，到能力提升</h2>
            </div>
            <p className="text-sm text-slate-500">先对话，再行动</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["发送材料", "让个人 Agent 先了解真实经历。"],
              ["AI 模拟面试", "围绕目标岗位补充关键证据。"],
              ["生成个人 Agent", "确认后，生成你的求职 Agent。"],
              ["发布到求职广场", "自主选择想聊的岗位和活动。"],
              ["A2A 自动沟通", "多个岗位 Agent 自动对话，提升匹配效率。"],
              ["知乎知识与行动", "根据反馈补齐短板，安排比赛、开源和实践。"],
            ].map(([title, detail], index) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-sm">
                <div className="flex items-center gap-3">
                  <span className={`grid size-8 place-items-center rounded-xl text-xs font-semibold ${index < 3 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-pink-600 uppercase">GROWTH ACTIVITIES</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">把差距变成一次真实实践</h2>
            </div>
            <Link href="/marketplace?tab=activities" className="shrink-0 text-sm font-medium text-pink-600 hover:text-pink-700">看全部 →</Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {ACTIVITY_LISTINGS.slice(0, 3).map((activity) => (
              <Link key={activity.id} href="/marketplace?tab=activities" className="group relative min-h-44 overflow-hidden rounded-2xl p-4 text-white shadow-sm">
                <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${activity.image})` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/10" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-medium backdrop-blur">{activity.category}</span><span className="text-xs text-white/70">{activity.deadline}</span></div>
                  <div><h3 className="text-lg font-semibold tracking-tight">{activity.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-white/75">{activity.subtitle}</p></div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10"><ZhihuHotList /></section>
      </main>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500 sm:px-6">Agent 对话 · 能力提升 · 知乎知识与活动</div></footer>
    </div>
  );
}
