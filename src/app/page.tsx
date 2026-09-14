import { HomePreview } from "@/components/home-preview";
import { LandingActions } from "@/components/landing-actions";
import { Nav } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";
import { ZhihuHotList } from "@/components/zhihu-hot-list";

export const dynamic = "force-dynamic";

export default function Home() {
  const snapshot = workspaceSnapshot();
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Nav />

      <main className="flex-1">
        <section className="stage-grid overflow-hidden border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-9 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-indigo-600 uppercase">
                AI AGENT × JOB GROWTH
              </p>
              <h1 className="mt-4 text-5xl leading-[0.98] font-semibold tracking-[-0.05em] text-slate-950 sm:text-7xl">
                Next Level
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-9 text-slate-700 sm:text-2xl">
                先找到差距，再走到目标岗位。
              </p>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
                让求职者 Agent 与岗位 Agent 在广场里先聊清楚，再把反馈变成一套可执行的提升安排。
              </p>
            </div>
            <HomePreview initial={snapshot} />
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-5 sm:grid-cols-2 sm:px-6 sm:py-7">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-indigo-600 uppercase">01 · A2A 提效</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">让 Agent 先替你聊清楚</p>
            <p className="mt-1 text-sm text-slate-600">岗位匹不匹配，先看证据和反馈。</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">02 · 能力提升</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">把差距变成下一步</p>
            <p className="mt-1 text-sm text-slate-600">用比赛、项目和实践，补出新证据。</p>
          </div>
        </section>

        <LandingActions initial={snapshot} />
        <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10">
          <ZhihuHotList />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500 sm:px-6">
          三个岗位 Agent · 可追溯 Demo · 知乎实时热榜
        </div>
      </footer>
    </div>
  );
}
