"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { callApi } from "@/lib/client/api";
import type { WorkspaceRole } from "@/lib/auth/roles";

const roles: { id: WorkspaceRole; title: string; detail: string; mark: string }[] = [
  { id: "candidate", title: "我是求职者", detail: "建立个人 Agent，找到下一步。", mark: "我" },
  { id: "employer", title: "我是招聘方", detail: "建立岗位 Agent，遇见合适的人。", mark: "招" },
];

export function RoleSelection({ initialRole, nextPath }: { initialRole: WorkspaceRole; nextPath?: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<WorkspaceRole>(initialRole);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function enter() {
    setBusy(true);
    setError("");
    const result = await callApi<{ role: WorkspaceRole; redirect: string }>("/api/auth/role", { role: selected, next: nextPath });
    if (result.ok) {
      router.push(result.data.redirect);
      return;
    }
    setError(result.blockers[0] ?? "暂时无法进入");
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[#f8f9fc] px-5 py-10 text-slate-950 sm:px-8 sm:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-between">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-indigo-600 text-xs font-bold text-white">NL</span>
            Next Level
          </Link>
          <span className="text-xs text-slate-400">Demo 体验</span>
        </header>

        <section className="mx-auto w-full max-w-3xl py-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-indigo-600 uppercase">进入你的空间</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">先选择你的身份。</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-500">不同身份，看到不同的工作空间。</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {roles.map((role) => {
              const active = selected === role.id;
              return (
                <button key={role.id} type="button" onClick={() => setSelected(role.id)} aria-pressed={active}
                  className={`group rounded-3xl border p-5 text-left transition ${active ? "border-indigo-500 bg-white shadow-[0_18px_45px_rgba(79,70,229,0.14)]" : "border-slate-200 bg-white/70 hover:border-indigo-300 hover:bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <span className={`grid size-11 place-items-center rounded-2xl text-sm font-semibold ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{role.mark}</span>
                    <span className={`grid size-6 place-items-center rounded-full border text-xs ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 text-transparent"}`}>✓</span>
                  </div>
                  <h2 className="mt-8 text-xl font-semibold tracking-tight">{role.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{role.detail}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={enter} disabled={busy} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60">
              {busy ? "进入中…" : "进入空间 →"}
            </button>
            <a href={`/api/auth/zhihu/start?role=${selected}`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">知乎登录</a>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
        </section>

        <p className="text-xs text-slate-400">演示模式会使用预置数据；知乎登录后，空间会与知乎账号绑定。</p>
      </div>
    </main>
  );
}
