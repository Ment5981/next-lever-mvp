"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { callApi } from "@/lib/client/api";
import type { ProviderCallMeta } from "@/lib/providers/types";
import type { ResumePolishDraft } from "@/lib/schema/domain";

const MODE_LABEL: Record<ProviderCallMeta["mode"], string> = {
  live: "真实模型",
  mock: "Demo",
  fallback: "Fallback",
};

export function ResumePolisher({
  targetRole,
  sourceText,
  onApply,
}: {
  targetRole: string;
  sourceText: string;
  onApply: (text: string) => void;
}) {
  const [draft, setDraft] = useState<ResumePolishDraft | null>(null);
  const [provider, setProvider] = useState<ProviderCallMeta | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(false);

  async function polish() {
    setBusy(true);
    setError("");
    setApplied(false);
    const result = await callApi<{ result: ResumePolishDraft; provider: ProviderCallMeta }>(
      "/api/candidate/resume/polish",
      { target_role: targetRole, source_text: sourceText },
    );
    if (result.ok) {
      setDraft(result.data.result);
      setProvider(result.data.provider);
    } else {
      setError(result.blockers[0] ?? "润色失败，请稍后再试");
    }
    setBusy(false);
  }

  return (
    <details className="group rounded-2xl border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-sm font-semibold text-slate-900">简历润色</span>
          <span className="mt-1 block text-xs text-slate-500">只优化表达，事实由你确认</span>
        </span>
        <span className="text-xs text-slate-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
      </summary>
      <div className="space-y-4 border-t border-slate-100 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-xs leading-5 text-slate-500">
            面向「{targetRole || "目标岗位"}」整理重点。不会补写经历、数字或作品。
          </p>
          <Button onClick={() => void polish()} busy={busy} disabled={!sourceText.trim()}>
            {draft ? "重新润色" : "开始润色"}
          </Button>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {draft && (
          <div className="space-y-3">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-indigo-900">建议版本</span>
                {provider && <span className="text-[11px] text-indigo-600">{MODE_LABEL[provider.mode]} · {provider.note}</span>}
              </div>
              <textarea
                value={draft.polished_text}
                onChange={(event) => setDraft((prev) => prev ? { ...prev, polished_text: event.target.value } : prev)}
                rows={9}
                className="w-full rounded-xl border border-indigo-100 bg-white p-3 text-sm leading-6 text-slate-800 outline-none focus:border-indigo-400"
                aria-label="润色后的简历"
              />
            </div>
            {draft.changed_points.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {draft.changed_points.map((point) => <span key={point} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{point}</span>)}
              </div>
            )}
            <p className="text-xs leading-5 text-amber-700">{draft.fact_check_note}</p>
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  onApply(draft.polished_text);
                  setApplied(true);
                }}
              >
                {applied ? "已应用到简历" : "应用到简历"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
