import Link from "next/link";

/** 工作台主流程导航。顺序与用户实际走的主流程一致。 */
export const WORKSPACE_STEPS = [
  { href: "/employer/job", label: "1 岗位创建" },
  { href: "/candidate/materials", label: "2 材料与面试" },
  { href: "/candidate/agent", label: "3 Agent 与授权" },
  { href: "/a2a", label: "4 A2A 时间线" },
  { href: "/employer/inbox", label: "5 招聘方工作台" },
  { href: "/growth", label: "6 成长报告" },
] as const;

export function Nav({ current }: { current?: string }) {
  return (
    <nav
      aria-label="主流程"
      className="border-b border-slate-200 bg-white/90 backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-slate-900"
          >
            Next Lever
          </Link>
          <ul className="-mx-1 flex snap-x gap-1 overflow-x-auto pb-1 text-xs">
            {WORKSPACE_STEPS.map((step) => {
              const active = current === step.href;
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
          </ul>
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
          <h1 className="text-xl font-semibold tracking-tight break-words text-slate-900 sm:text-2xl">
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
