import Link from "next/link";
import { ZhihuAccount } from "@/components/zhihu-account";

/** 工作台主流程导航。顺序与用户实际走的主流程一致。 */
export const PRIMARY_NAV = [
  { href: "/marketplace", label: "求职广场" },
  { href: "/candidate", label: "求职者" },
  { href: "/employer", label: "招聘方" },
] as const;

function activeFor(current: string | undefined, href: string) {
  if (!current) return false;
  return current === href || current.startsWith(`${href}/`);
}

export function Nav({ current }: { current?: string }) {
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
            <ul className="-mx-1 flex min-w-0 snap-x gap-1 overflow-x-auto pb-0.5 text-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              <li className="snap-start">
                <Link href="/candidate/workbench" className={`inline-block rounded-lg px-2.5 py-1.5 whitespace-nowrap ${current?.includes("/workbench") ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>工作台</Link>
              </li>
            </ul>
            <ZhihuAccount />
          </div>
        </div>
      </div>
    </nav>
  );
}

/** 页面外壳：导航 + 标题 + 主体，统一控制最大宽度与移动端内边距。 */
export function PageShell({
  current,
  title,
  lead,
  children,
}: {
  current?: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Nav current={current} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <header className="mb-5">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-indigo-600 uppercase">
                next level / workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight break-words text-slate-950 sm:text-3xl">
            {title}
          </h1>
          {lead && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed break-words text-slate-600">
              {lead}
            </p>
          )}
        </header>
        <div className="space-y-5">{children}</div>
      </main>
    </div>
  );
}
