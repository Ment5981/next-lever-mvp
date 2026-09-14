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
                agent-to-agent workspace
              </p>
              <h1 className="mt-4 text-5xl leading-[0.98] font-semibold tracking-[-0.05em] text-slate-950 sm:text-7xl">
                Next Lever
              </h1>
              <p className="mt-5 max-w-xl text-xl leading-9 text-slate-700 sm:text-2xl">
                投出去的简历，第一次有了可追溯的回音
              </p>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
                让求职者 Agent 与多个岗位 Agent 沟通，把反馈变成下一件能产生新证据的事。
              </p>
            </div>
            <HomePreview initial={snapshot} />
          </div>
        </section>

        <LandingActions initial={snapshot} />
        <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10">
          <ZhihuHotList />
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs leading-relaxed text-slate-500 sm:px-6">
          初级 AI 应用产品经理 · 三个预置岗位 · 可追溯 Demo
        </div>
      </footer>
    </div>
  );
}
