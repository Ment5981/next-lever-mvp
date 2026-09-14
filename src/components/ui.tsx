import type { ReactNode } from "react";

/** 面板容器。所有页面统一用它分块，避免长中文标题在窄屏溢出。 */
export function Panel({
  title,
  subtitle,
  aside,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {(title || aside) && (
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold break-words text-slate-900 sm:text-lg">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm leading-relaxed break-words text-slate-500">
                {subtitle}
              </p>
            )}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export type Tone =
  | "neutral"
  | "info"
  | "good"
  | "warn"
  | "bad"
  | "demo"
  | "accent";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  bad: "bg-rose-50 text-rose-700 border-rose-200",
  demo: "bg-violet-50 text-violet-700 border-violet-200",
  accent: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

/** 状态标签。演示数据一律用 demo 色，确保用户能区分真实与演示。 */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-5 break-words ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

/** 门禁提示。空数组不渲染，避免页面上出现空白告警框。 */
export function Blockers({
  items,
  title = "还不能继续",
}: {
  items: string[];
  title?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <p className="font-medium">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="break-words">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-3 text-sm leading-relaxed break-words ${TONE_CLASS[tone]}`}
    >
      {children}
    </div>
  );
}

/** 键值行。用于展示评分、置信度、样本数这类可核验的数字。 */
export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold break-words text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs break-words text-slate-500">{hint}</p>}
    </div>
  );
}

/** 引用块。展示原始反馈与证据原文，必须能看出来源标签。 */
export function Quote({
  text,
  source,
  meta,
}: {
  text: string;
  source?: string;
  meta?: string;
}) {
  return (
    <figure className="rounded-xl border-l-4 border-slate-300 bg-slate-50 py-2 pr-3 pl-3">
      <blockquote className="text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-700">
        {text}
      </blockquote>
      {(source || meta) && (
        <figcaption className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {source && <Badge tone="neutral">来源：{source}</Badge>}
          {meta && <span className="break-words">{meta}</span>}
        </figcaption>
      )}
    </figure>
  );
}

/** 永久免责说明。PRD 要求出现在求职者结果与成长报告页面。 */
export function Disclaimer() {
  return (
    <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
      本页结果来自有限的模拟评估样本，只反映所授权岗位的招聘方 Agent
      判断与真人确认，不构成对个人能力的最终结论，也不能代表整体就业市场。
      缺少证据的能力项一律标注为证据不足，不等于不具备该能力。
    </p>
  );
}

export function Spinner({ label = "加载中" }: { label?: string }) {
  return (
    <p className="py-8 text-center text-sm text-slate-500" role="status">
      {label}…
    </p>
  );
}
