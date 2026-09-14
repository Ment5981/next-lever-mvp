import Link from "next/link";
import { ZhihuAccount } from "@/components/zhihu-account";

/** 角色主流程导航。深度配置从角色页面进入，不单独占用主导航。 */
export const PRIMARY_NAV = [
  { href: "/marketplace", label: "求职广场" },
  { href: "/candidate", label: "求职者" },
  { href: "/coach", label: "成长教练" },
  { href: "/employer", label: "招聘方" },
] as const;

function activeFor(current: string | undefined, href: string) {
  if (!current) return false;
  return current === href || current.startsWith(`${href}/`);
}

export function Nav({ current, minimal = false }: { current?: string; minimal?: boolean }) {
  return (
    <nav
      aria-label="主流程"
      className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-xs font-semibold text-white shadow-sm">
              NL
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-slate-900">
                Next Level
              </span>
              <span className="hidden text-[10px] tracking-[0.18em] text-slate-400 uppercase sm:block">
                agent workspace
              </span>
            </span>
          </Link>
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            {!minimal && <ul className="-mx-1 flex min-w-0 snap-x gap-1 overflow-x-auto pb-0.5 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {PRIMARY_NAV.map((step) => {
                const active = activeFor(current, step.href);
                return (
                  <li key={step.href} className="snap-start">
                    <Link
                      href={step.href}
                      aria-current={active ? "page" : undefined}
                      className={`inline-block rounded-lg px-2.5 py-1.5 whitespace-nowrap ${
                        active
                          ? "bg-indigo-600 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {step.label}
                    </Link>
                  </li>
                );
              })}
            </ul>}
            <ZhihuAccount />
          </div>
        </div>
      </div>
    </nav>
  );
}

const CANDIDATE_WORKSPACE_NAV = [
  { href: "/", label: "首页" },
  { href: "/marketplace", label: "求职广场" },
  { href: "/candidate/materials", label: "简历优化" },
  { href: "/coach", label: "进阶路径" },
  { href: "/candidate/materials#interview", label: "模拟面试" },
  { href: "/a2a", label: "求职记录" },
  { href: "/growth", label: "我的成长" },
] as const;

/** 求职者统一工作空间导航，技术细节留在各页面内部。 */
export function CandidateWorkspaceSidebar({ current, activeHref }: { current?: string; activeHref?: string }) {
  return (
    <nav aria-label="求职者工作空间" className="text-sm">
      <p className="mb-4 px-3 text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
        我的空间
      </p>
      <ul className="candidate-workspace-nav-list flex w-max gap-1 lg:block lg:w-auto lg:space-y-1">
        {CANDIDATE_WORKSPACE_NAV.map((item) => {
          const baseHref = item.href.split("#")[0];
          const active = activeHref
            ? item.href === activeHref
            : current === "/coach"
              ? item.href === "/coach"
              : activeFor(current, baseHref) && item.href === baseHref;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-xl border-l-2 px-3 transition active:translate-x-px ${
                  active
                    ? "border-indigo-600 bg-indigo-50 font-semibold text-indigo-700"
                    : "border-transparent text-slate-600 hover:bg-white hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 页面外壳：导航 + 标题 + 主体，统一控制最大宽度与移动端内边距。 */
export function PageShell({
  current,
  title,
  lead,
  headerAside,
  backHref,
  backLabel = "返回",
  sidebar,
  children,
}: {
  current?: string;
  title: string;
  lead?: string;
  headerAside?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hasSidebar = Boolean(sidebar);
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Nav current={current} minimal={hasSidebar} />
      <div className={`mx-auto flex w-full flex-1 ${hasSidebar ? "max-w-[1400px]" : "max-w-6xl"}`}>
        {sidebar && (
          <aside className="candidate-workspace-desktop-sidebar hidden w-[220px] shrink-0 border-r border-slate-200 px-5 py-8 lg:block">
            <div className="sticky top-24">{sidebar}</div>
          </aside>
        )}
        <main className={`w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 ${hasSidebar ? "lg:px-10" : ""}`}>
        {sidebar && <div className="candidate-workspace-mobile-nav mb-5 overflow-x-auto lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{sidebar}</div>}
        <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {backHref && (
              <Link
                href={backHref}
                className="mb-3 inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700 hover:shadow-md"
              >
                <span aria-hidden className="grid size-5 place-items-center rounded-full bg-indigo-50 text-indigo-700">←</span>
                {backLabel}
              </Link>
            )}
            <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-indigo-600 uppercase">
              next level / space
            </p>
            <h1 className="text-2xl font-semibold tracking-tight break-words text-slate-950 sm:text-3xl">
              {title}
            </h1>
            {lead && (
              <p className="mt-2 max-w-3xl text-sm leading-relaxed break-words text-slate-600">
                {lead}
              </p>
            )}
          </div>
          {headerAside}
        </header>
        <div className="space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
