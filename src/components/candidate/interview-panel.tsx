"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { VoiceInput } from "@/components/voice-input";
import { Badge, Blockers, Notice, Panel } from "@/components/ui";
import type { InterviewSession, InterviewTurn, JobVersion } from "@/lib/schema/domain";

export type InterviewAction =
  | { action: "generate"; target_job_version_id: string | null }
  | {
      action: "answer";
      turn_id: string;
      answer_mode: "text" | "voice";
      raw_answer: string;
      transcript_confirmed: boolean;
    }
  | { action: "confirm_summary"; turn_id: string; answer_summary: string }
  | { action: "complete" };

type InterviewMode = "voice" | "manual";

/** AI 语音面试与手动微调共存，回答仍由用户确认后才进入求职者 Agent。 */
export function InterviewPanel({
  jobs,
  interview,
  targetJob,
  onTargetJobChange,
  onAction,
  busy,
  blockers,
}: {
  jobs: JobVersion[];
  interview: InterviewSession | null;
  targetJob: string;
  onTargetJobChange: (value: string) => void;
  onAction: (action: InterviewAction, key: string) => Promise<boolean>;
  busy: string | null;
  blockers: string[];
}) {
  const [mode, setMode] = useState<InterviewMode>("voice");
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [summaryDraft, setSummaryDraft] = useState<Record<string, string>>({});
  const [voiceTurn, setVoiceTurn] = useState<Record<string, boolean>>({});

  const turns = interview?.turns ?? [];
  const answered = turns.filter((turn) => turn.raw_answer.trim().length > 0);
  const summariesConfirmed = turns.filter((turn) => turn.summary_confirmed);
  const activeIndex = turns.findIndex((turn) => !turn.raw_answer.trim());
  // 预置演示会带有已完成问答，仍保留一题可体验语音面试与回填。
  const voiceIndex = activeIndex >= 0 ? activeIndex : turns.length - 1;
  const activeTurn = voiceIndex >= 0 ? turns[voiceIndex] : null;

  const speakQuestion = useCallback((question: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "zh-CN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(
    () => () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  function draftFor(turn: InterviewTurn) {
    return answerDraft[turn.turn_id] ?? turn.raw_answer;
  }

  function setDraft(turn: InterviewTurn, value: string, fromVoice = false) {
    setAnswerDraft((prev) => ({ ...prev, [turn.turn_id]: value }));
    setVoiceTurn((prev) => ({ ...prev, [turn.turn_id]: fromVoice }));
  }

  function submitAnswer(turn: InterviewTurn) {
    const draft = draftFor(turn);
    return onAction(
      {
        action: "answer",
        turn_id: turn.turn_id,
        answer_mode: voiceTurn[turn.turn_id] ? "voice" : "text",
        raw_answer: draft,
        transcript_confirmed: voiceTurn[turn.turn_id] ?? false,
      },
      `answer-${turn.turn_id}`,
    );
  }

  function summaryEditor(turn: InterviewTurn) {
    if (!turn.answer_summary) return null;
    return (
      <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-slate-700">
          查看并确认 AI 摘要
        </summary>
        <div className="mt-3 space-y-2">
          <textarea
            value={summaryDraft[turn.turn_id] ?? turn.answer_summary}
            onChange={(event) =>
              setSummaryDraft((prev) => ({ ...prev, [turn.turn_id]: event.target.value }))
            }
            rows={3}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm leading-relaxed"
          />
          <Button
            onClick={() =>
              onAction(
                {
                  action: "confirm_summary",
                  turn_id: turn.turn_id,
                  answer_summary: summaryDraft[turn.turn_id] ?? turn.answer_summary,
                },
                `summary-${turn.turn_id}`,
              )
            }
            busy={busy === `summary-${turn.turn_id}`}
          >
            确认摘要
          </Button>
        </div>
      </details>
    );
  }

  function manualTurn(turn: InterviewTurn, index: number) {
    const draft = draftFor(turn);
    const isCurrent = !turn.raw_answer.trim();
    return (
      <details
        key={turn.turn_id}
        open={isCurrent}
        className="group rounded-2xl border border-slate-200 bg-white"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-indigo-50 text-xs font-semibold text-indigo-700">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="truncate text-sm font-medium text-slate-900">{turn.question}</span>
          </div>
          <span className="shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <div className="space-y-3 border-t border-slate-100 px-4 pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={turn.raw_answer ? "good" : "accent"}>{turn.raw_answer ? "已回答" : "等你回答"}</Badge>
            {turn.answer_summary && <Badge tone={turn.summary_confirmed ? "good" : "warn"}>{turn.summary_confirmed ? "摘要已确认" : "摘要待确认"}</Badge>}
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(turn, event.target.value)}
            rows={4}
            placeholder="写下或微调你的回答"
            className="w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
          />
          <Button
            variant="secondary"
            onClick={() => submitAnswer(turn)}
            busy={busy === `answer-${turn.turn_id}`}
            disabled={draft.trim().length === 0}
          >
            提交回答
          </Button>
          {summaryEditor(turn)}
        </div>
      </details>
    );
  }

  return (
    <Panel
      title="AI 模拟面试"
      subtitle="像聊天一样回答，完成后可手动微调。"
      aside={<Badge tone={interview?.completed ? "good" : "accent"}>{interview?.completed ? "已完成" : "可开始"}</Badge>}
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#eef2ff_0%,#f8fafc_52%,#ecfeff_100%)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-lg text-white shadow-lg shadow-indigo-200">✦</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">和 AI 面试官聊聊</p>
                <p className="mt-1 text-xs text-slate-600">问题会根据你的材料和目标岗位生成</p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block min-w-0">
                <span className="sr-only">目标岗位</span>
                <select
                  value={targetJob}
                  onChange={(event) => onTargetJobChange(event.target.value)}
                  className="min-h-10 max-w-full rounded-xl border border-white/80 bg-white/80 px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-400"
                >
                  {jobs.map((job) => <option key={job.job_version_id} value={job.job_version_id}>{job.company_name} · {job.title}</option>)}
                </select>
              </label>
              <Button
                onClick={() => onAction({ action: "generate", target_job_version_id: targetJob || null }, "generate")}
                busy={busy === "generate"}
                className="min-h-10 whitespace-nowrap"
              >
                {turns.length > 0 ? "重新开始" : "开始 AI 面试"}
              </Button>
            </div>
          </div>
        </div>

        {turns.length === 0 && <Notice tone="neutral">点击上面的按钮，开始一次岗位模拟面试。</Notice>}

        {turns.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("voice")}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${mode === "voice" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              <span aria-hidden="true">◉</span> AI 语音面试
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${mode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              <span aria-hidden="true">✎</span> 自己编辑
            </button>
          </div>
        )}

        {mode === "voice" && activeTurn && (
          <div className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><Badge tone="accent">AI 面试官</Badge><span className="text-xs text-slate-500">问题 {voiceIndex + 1}/{turns.length}</span></div>
              <Button variant="ghost" onClick={() => speakQuestion(activeTurn.question)} className="min-h-8 px-2 text-xs">听一遍</Button>
            </div>
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white shadow-md">✦</div>
              <p className="max-w-2xl rounded-2xl rounded-tl-sm bg-white p-4 text-base leading-relaxed text-slate-900 shadow-sm">{activeTurn.question}</p>
            </div>
            <div className="mx-auto grid max-w-xs place-items-center gap-3 py-2">
              <div className="flex h-10 items-end gap-1" aria-hidden="true">
                {[18, 30, 42, 25, 36, 20, 32, 24, 40, 18, 28].map((height, index) => <span key={index} className="w-1.5 rounded-full bg-indigo-400/70" style={{ height }} />)}
              </div>
              <p className="text-xs text-slate-500">点击下方按钮，直接说出你的回答</p>
            </div>
            <VoiceInput
              compact
              label="开始说话"
              confirmLabel="填入回答框"
              onConfirm={(text) => setDraft(activeTurn, draftFor(activeTurn) ? `${draftFor(activeTurn)}\n${text}` : text, true)}
            />
            <textarea
              value={draftFor(activeTurn)}
              onChange={(event) => setDraft(activeTurn, event.target.value)}
              rows={3}
              placeholder="语音转写会出现在这里，也可以直接修改"
              className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500">转写确认后才会提交给 AI</span>
              <Button onClick={() => submitAnswer(activeTurn)} busy={busy === `answer-${activeTurn.turn_id}`} disabled={draftFor(activeTurn).trim().length === 0}>提交这一题</Button>
            </div>
          </div>
        )}

        {mode === "voice" && turns.some((turn) => turn.raw_answer.trim()) && (
          <details className="group rounded-2xl border border-slate-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
              查看已完成问题 <span className="text-xs text-slate-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="space-y-2 border-t border-slate-100 p-3">
              {turns.map((turn, index) => turn.raw_answer.trim() ? <div key={turn.turn_id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">问题 {index + 1}</p><p className="mt-1 text-sm font-medium text-slate-800">{turn.question}</p>{summaryEditor(turn)}</div> : null)}
            </div>
          </details>
        )}

        {mode === "manual" && <div className="space-y-2">{turns.map(manualTurn)}</div>}

        <Blockers items={blockers} />
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button onClick={() => onAction({ action: "complete" }, "complete")} busy={busy === "complete"} disabled={answered.length < 3 || summariesConfirmed.length < answered.length}>完成面试</Button>
          <span className="text-xs text-slate-500">{answered.length}/{turns.length} 已回答 · {summariesConfirmed.length} 条摘要已确认</span>
        </div>
      </div>
    </Panel>
  );
}
