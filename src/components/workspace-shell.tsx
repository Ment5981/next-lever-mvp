"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ZhihuAccount } from "@/components/zhihu-account";
import { callApi } from "@/lib/client/api";
import type { WorkspaceRole } from "@/lib/auth/roles";

type NavItem = { href: string; label: string; icon: string };

const NAV: Record<WorkspaceRole, NavItem[]> = {
  candidate: [
    { href: "/app/candidate", label: "首页", icon: "⌂" },
    { href: "/app/candidate/explore", label: "求职广场", icon: "⌕" },
    { href: "/app/candidate/resume", label: "简历与 Agent", icon: "▤" },
    { href: "/app/candidate/interview", label: "模拟面试", icon: "◉" },
    { href: "/app/candidate/path", label: "进阶路径", icon: "↗" },
    { href: "/app/candidate/agent", label: "我的智能体", icon: "✦" },
  ],
  employer: [
    { href: "/app/employer", label: "首页", icon: "⌂" },
    { href: "/app/employer/talent", label: "求职广场", icon: "⌕" },
    { href: "/app/employer/jobs", label: "我的智能体", icon: "✦" },
  ],
};

function isActive(pathname: string, href: string) {
  return href === pathname || (href !== "/app/candidate" && href !== "/app/employer" && pathname.startsWith(`${href}/`));
}

type SidebarProfile = { fullname: string; avatar_path: string };

function SidebarAccount({ onNavigate }: { onNavigate?: () => void }) {
  const [profile, setProfile] = useState<SidebarProfile | null>(null);

  useEffect(() => {
    let active = true;
    void callApi<{ authenticated: boolean; profile: SidebarProfile | null }>("/api/auth/zhihu/me").then((result) => {
      if (active && result.ok && result.data.authenticated) setProfile(result.data.profile);
    });
    return () => { active = false; };
  }, []);

  if (!profile) {
    return <Link href="/api/auth/zhihu/start" onClick={onNavigate} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"><span className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-xl bg-indigo-100 text-xs font-semibold text-indigo-700">知</span><span><span className="block text-xs font-semibold text-slate-800">登录知乎</span><span className="mt-0.5 block text-[10px] text-slate-400">同步你的 Next Level</span></span></span><span className="text-base text-slate-400">→</span></Link>;
  }

  return <Link href="/account" onClick={onNavigate} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"><span className="flex min-w-0 items-center gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-100 text-xs font-semibold text-indigo-700" style={profile.avatar_path ? { backgroundImage: `url(${profile.avatar_path})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>{!profile.avatar_path && profile.fullname.slice(0, 1)}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-slate-800">{profile.fullname}</span><span className="mt-0.5 block text-[10px] text-slate-400">登录设置</span></span></span><span className="text-base text-slate-400">›</span></Link>;
}

function Sidebar({ role, onNavigate }: { role: WorkspaceRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <Link href="/" onClick={onNavigate} aria-label="返回 Next Level 营销页" className="flex items-center gap-2.5 px-3 py-2 text-lg font-semibold tracking-tight">
        <span className="grid size-8 place-items-center rounded-xl bg-indigo-600 text-[10px] font-bold text-white shadow-sm">NL</span>
        Next Level
      </Link>
      <div className="mt-10 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase">{role === "candidate" ? "求职者空间" : "招聘方空间"}</div>
      <nav aria-label={role === "candidate" ? "求职者导航" : "招聘方导航"} className="mt-3 space-y-1">
        {NAV[role].map((item) => {
          const active = isActive(pathname, item.href);
          return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${active ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}><span className={`grid size-7 place-items-center rounded-lg text-base ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{item.icon}</span>{item.label}</Link>;
        })}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-4">
        <SidebarAccount onNavigate={onNavigate} />
        <div className="mt-2 space-y-1">
        <Link href="/onboarding/role" onClick={onNavigate} className="block rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-900">切换身份</Link>
        <Link href="/" onClick={onNavigate} className="block rounded-xl px-3 py-2 text-xs text-slate-400 hover:bg-slate-50 hover:text-slate-700">回到首页</Link>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceShell({ role, children }: { role: WorkspaceRole; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const current = NAV[role].find((item) => isActive(pathname, item.href));
  return (
    <div className="workspace-shell min-h-screen bg-[#f8f9fc] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200/80 bg-white px-4 py-6 lg:block"><Sidebar role={role} /></aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} className="grid size-9 place-items-center rounded-xl border border-slate-200 text-lg text-slate-600 lg:hidden" aria-label="打开导航">☰</button><div><p className="text-sm font-semibold">{current?.label ?? (role === "candidate" ? "求职者空间" : "招聘方空间")}</p><p className="hidden text-[11px] text-slate-400 sm:block">{role === "candidate" ? "把每一次反馈变成下一步" : "让岗位与合适的人先聊起来"}</p></div></div>
          <div className="flex items-center gap-2"><span className="hidden rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700 sm:inline-flex">Demo 空间</span><ZhihuAccount /></div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">{children}</main>
      </div>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileOpen(false); }}><aside className="h-full w-72 bg-white px-4 py-6 shadow-2xl"><div className="mb-5 flex justify-end"><button type="button" onClick={() => setMobileOpen(false)} className="grid size-9 place-items-center rounded-xl bg-slate-100 text-lg text-slate-600" aria-label="关闭导航">×</button></div><Sidebar role={role} onNavigate={() => setMobileOpen(false)} /></aside></div>}
    </div>
  );
}

export function WorkspaceHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold tracking-[0.2em] text-indigo-600 uppercase">{eyebrow ?? "Next Level"}</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</header>;
}
