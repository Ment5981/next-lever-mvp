"use client";

import { useState } from "react";
import type { WorkspaceState } from "@/lib/client/types";
import { stateText } from "@/lib/a2a/protocol";
import type { Tone } from "@/components/ui";

type PreviewOption = {
  id: string;
  letter: string;
  company: string;
  focus: string;
  outcome: string;
  tone: Tone;
  detail: string;
};

const OPTIONS: PreviewOption[] = [
  {
    id: "jv_job_a_v1",
    letter: "A",
    company: "启明智研",
    focus: "用户研究与产品闭环",
    outcome: "建议邀约",
    tone: "good",
    detail: "研究证据和上线复盘完整，岗位 Agent 找到了可核验的产品闭环。",
  },
  {
    id: "jv_job_b_v1",
    letter: "B",
    company: "远景数科",
    focus: "企业交付与业务结果",
    outcome: "暂不邀约",
    tone: "warn",
    detail: "已有项目经验，但企业客户和业务结果的直接证据还不够。",
  },
  {
    id: "jv_job_c_v1",
    letter: "C",
    company: "拾光实验室",
    focus: "AI 技术理解与作品",
    outcome: "人工复核",
    tone: "info",
    detail: "技术理解有线索，可运行作品链接缺失，因此交给真人进一步判断。",
  },
];

const TONE_CLASS: Record<Tone, string> = {
  neutral: "border-slate-300 bg-slate-100 text-slate-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  good: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  bad: "border-rose-200 bg-rose-50 text-rose-700",
  demo: "border-violet-200 bg-violet-50 text-violet-700",
  accent: "border-indigo-200 bg-indigo-50 text-indigo-700",
};

export function HomePreview({ initial }: { initial: WorkspaceState }) {
  const [activeId, setActiveId] = useState(OPTIONS[0].id);
  const active = OPTIONS.find((item) => item.id === activeId) ?? OPTIONS[0];
  const assessment = initial.assessments.find((item) => item.job_version_id === active.id);
  const task = initial.tasks.find((item) => item.job_version_id === active.id);

  return (
    <div className="agent-stage stage-grid p-4 sm:p-5" aria-label="Agent 协作预览">
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-indigo-600 uppercase">A2A PREVIEW</p>
          <p className="mt-1 text-sm font-medium text-slate-900">看一眼岗位反馈</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[10px] text-slate-500">可追溯</span>
      </div>

      <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-[0.72fr_1.28fr]">
        <div className="flex gap-2 sm:flex-col">
          {OPTIONS.map((option) => {
            const selected = option.id === active.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveId(option.id)}
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] sm:flex-none ${
                  selected
                    ? "border-indigo-400 bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "border-white/80 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-indigo-200"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${selected ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>
                  {option.letter}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{option.company}</span>
                  <span className={`mt-0.5 block truncate text-[10px] ${selected ? "text-indigo-100" : "text-slate-500"}`}>{option.outcome}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-500">{active.company} Agent</span>
            <span className={`rounded-full border px-2 py-1 text-[10px] ${TONE_CLASS[active.tone]}`}>{active.outcome}</span>
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{active.focus}</h2>
          <p className="mt-2 text-xs leading-6 text-slate-500">{assessment?.suggestion_reason ?? active.detail}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-[10px] text-slate-400">Task 状态</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{task ? stateText(task.state) : "待沟通"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-[10px] text-slate-400">匹配度</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{assessment ? assessment.soft_match_score.toFixed(1) : "--"}</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-slate-400">点击左侧岗位，查看不同判断。</p>
        </div>
      </div>

      <div className="absolute right-4 bottom-4 left-4 z-10 flex items-center justify-between rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-[10px] text-slate-500 backdrop-blur">
        <span>岗位 Agent</span>
        <span className="font-medium text-slate-700">判断差距 → 安排下一步</span>
      </div>
    </div>
  );
}
