"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400",
  ghost:
    "border border-transparent bg-transparent text-indigo-700 hover:bg-indigo-50 disabled:text-slate-400",
  danger:
    "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:text-slate-400",
};

export function Button({
  variant = "primary",
  busy = false,
  children,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || busy}
      aria-busy={busy}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`}
    >
      {busy ? "处理中…" : children}
    </button>
  );
}
