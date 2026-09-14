import { HomePreview } from "@/components/home-preview";
import { LandingActions } from "@/components/landing-actions";
import { Nav } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";
import { ZhihuHotList } from "@/components/zhihu-hot-list";
import Link from "next/link";

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
                投出去的简历，第一次有了可追溯的回音。
              </p>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
                让 Agent 先替你聊清楚，再把岗位差距变成下一步。
              </p>
              <div className="mt-7 grid max-w-lg grid-cols-2 gap-2">
                <Link href="/candidate" className="group flex min-h-14 items-center justify-between rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-500">
                  我是求职者 <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link href="/employer" className="group flex min-h-14 items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50">
                  我是招聘方 <span className="text-lg text-slate-400 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
            <HomePreview initial={snapshot} />
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-indigo-600 uppercase">HOW IT WORKS</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">一条从材料到成长的工作流</h2>
            </div>
            <p className="text-sm text-slate-500">每一步都由你决定是否继续</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["发送材料", "上传简历、项目和作品，让 Agent 先认识你。"],
              ["AI 模拟面试", "进入实时语音房间，Agent 根据目标岗位追问。"],
              ["生成个人 Agent", "确认事实和回答，生成可以被看见的自己。"],
              ["发布到求职广场", "选择披露范围，手动挑选想聊的岗位。"],
              ["A2A 自动沟通", "你的 Agent 与多个岗位 Agent 对话，留下可追踪反馈。"],
              ["知乎知识与行动", "平台 Agent 总结差距，推荐比赛、开源和实践。"],
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
