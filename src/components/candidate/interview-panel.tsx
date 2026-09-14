"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type InterviewMode = "live" | "manual";

/** 实时语音面试房间：Agent 一问一答，手动模式用于复盘和微调。 */
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
  const [mode, setMode] = useState<InterviewMode>("live");
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [summaryDraft, setSummaryDraft] = useState<Record<string, string>>({});
  const spokenTurnRef = useRef<string | null>(null);

  const turns = interview?.turns ?? [];
  const answered = turns.filter((turn) => turn.raw_answer.trim().length > 0);
  const summariesConfirmed = turns.filter((turn) => turn.summary_confirmed);
  const activeIndex = turns.findIndex((turn) => !turn.raw_answer.trim());
  const activeTurn = activeIndex >= 0 ? turns[activeIndex] : null;

  const speakQuestion = useCallback((question: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = "zh-CN";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (mode !== "live" || !activeTurn || busy) return;
    if (spokenTurnRef.current === activeTurn.turn_id) return;
    spokenTurnRef.current = activeTurn.turn_id;
    const timer = window.setTimeout(() => speakQuestion(activeTurn.question), 350);
    return () => window.clearTimeout(timer);
  }, [activeTurn, busy, mode, speakQuestion]);

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

  function setDraft(turn: InterviewTurn, value: string) {
    setAnswerDraft((prev) => ({ ...prev, [turn.turn_id]: value }));
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
            onChange={(event) => setSummaryDraft((prev) => ({ ...prev, [turn.turn_id]: event.target.value }))}
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

  function submitManualAnswer(turn: InterviewTurn) {
    const draft = draftFor(turn);
    return onAction(
      {
        action: "answer",
        turn_id: turn.turn_id,
        answer_mode: "text",
        raw_answer: draft,
        transcript_confirmed: false,
      },
      `answer-${turn.turn_id}`,
    );
  }

  function manualTurn(turn: InterviewTurn, index: number) {
    const draft = draftFor(turn);
    return (
      <details key={turn.turn_id} open={!turn.raw_answer.trim()} className="group rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-indigo-50 text-xs font-semibold text-indigo-700">{String(index + 1).padStart(2, "0")}</span>
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
            placeholder="手动输入或微调回答"
            className="w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
          />
          <Button variant="secondary" onClick={() => submitManualAnswer(turn)} busy={busy === `answer-${turn.turn_id}`} disabled={draft.trim().length === 0}>提交回答</Button>
          {summaryEditor(turn)}
        </div>
      </details>
    );
  }

  async function submitLiveAnswer(turn: InterviewTurn, transcript: string) {
    setDraft(turn, transcript);
    await onAction(
      {
        action: "answer",
        turn_id: turn.turn_id,
        answer_mode: "voice",
        raw_answer: transcript,
        transcript_confirmed: true,
      },
      `answer-${turn.turn_id}`,
    );
  }

  return (
    <Panel
      title="AI 模拟面试"
      subtitle="进入实时房间，和岗位 Agent 一问一答。"
      aside={<Badge tone={interview?.completed ? "good" : "accent"}>{interview?.completed ? "已完成" : "可开始"}</Badge>}
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#111827_0%,#312e81_55%,#0f766e_100%)] p-4 text-white sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-lg shadow-inner">✦</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">实时 AI 面试</p>
                <p className="mt-1 text-xs text-indigo-100">AI 会直接发问，你只需要开口回答</p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block min-w-0">
                <span className="sr-only">目标岗位</span>
                <select
                  value={targetJob}
                  onChange={(event) => onTargetJobChange(event.target.value)}
                  className="min-h-10 max-w-full rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white outline-none focus:border-white/60 [&>option]:text-slate-900"
                >
                  {jobs.map((job) => <option key={job.job_version_id} value={job.job_version_id}>{job.company_name} · {job.title}</option>)}
                </select>
              </label>
              <Button
                variant="secondary"
                onClick={() => {
                  spokenTurnRef.current = null;
                  onAction({ action: "generate", target_job_version_id: targetJob || null }, "generate");
                }}
                busy={busy === "generate"}
                className="min-h-10 whitespace-nowrap border-white/20 bg-white text-indigo-900 hover:bg-indigo-50"
              >
                {turns.length > 0 ? "重新进入" : "进入实时面试"}
              </Button>
            </div>
          </div>
        </div>

        {turns.length === 0 && <Notice tone="neutral">点击“进入实时面试”，AI 面试官会开始第一问。</Notice>}

        {turns.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => setMode("live")} className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${mode === "live" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <span aria-hidden="true">◉</span> 实时语音
            </button>
            <button type="button" onClick={() => setMode("manual")} className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition ${mode === "manual" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <span aria-hidden="true">✎</span> 手动微调
            </button>
          </div>
        )}

        {mode === "live" && activeTurn && (
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 text-white sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.34),transparent_45%)]" />
            <div className="relative space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><span className="size-2 animate-pulse rounded-full bg-emerald-400" /><span className="text-xs font-medium text-emerald-300">LIVE</span><span className="text-xs text-slate-400">AI 面试官</span></div>
                <span className="text-xs text-slate-400">第 {activeIndex + 1} / {turns.length} 问</span>
              </div>
              <div className="mx-auto grid max-w-sm place-items-center gap-4 py-2 text-center">
                <div className="relative grid size-24 place-items-center rounded-full bg-indigo-500/20 ring-1 ring-indigo-300/30">
                  <div className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-teal-300 text-2xl text-white shadow-2xl shadow-indigo-500/40">✦</div>
                  <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/10" />
                </div>
                <p className="text-sm text-slate-300">AI 正在向你提问</p>
              </div>
              <div className="mx-auto max-w-2xl rounded-2xl rounded-tl-sm bg-white/10 p-4 text-center text-base leading-relaxed text-white ring-1 ring-white/10">{activeTurn.question}</div>
              <div className="mx-auto max-w-md">
                <VoiceInput
                  live
                  label="点击开始回答"
                  confirmLabel="确认并发送"
                  onConfirm={(text) => void submitLiveAnswer(activeTurn, text)}
                />
              </div>
              <p className="text-center text-xs text-slate-400">听完转写并确认后，AI 会自动进入下一问</p>
            </div>
          </div>
        )}

        {mode === "live" && !activeTurn && turns.length > 0 && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">这次实时面试已回答完毕。可以切换到“手动微调”检查回答。</div>
        )}

        {mode === "live" && answered.length > 0 && (
          <details className="group rounded-2xl border border-slate-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
              面试记录 · {answered.length} 题已完成
              <span className="text-xs text-slate-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="space-y-2 border-t border-slate-100 p-3">
              {turns.map((turn, index) => turn.raw_answer.trim() ? <div key={turn.turn_id} className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">问题 {index + 1}</p><p className="mt-1 text-sm font-medium text-slate-800">{turn.question}</p>{summaryEditor(turn)}</div> : null)}
            </div>
          </details>
        )}

        {mode === "manual" && turns.length > 0 && <div className="space-y-2">{turns.map(manualTurn)}</div>}

        <Blockers items={blockers} />
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button onClick={() => onAction({ action: "complete" }, "complete")} busy={busy === "complete"} disabled={answered.length < 3 || summariesConfirmed.length < answered.length}>完成面试</Button>
          <span className="text-xs text-slate-500">{answered.length}/{turns.length} 已回答 · {summariesConfirmed.length} 条摘要已确认</span>
        </div>
      </div>
    </Panel>
  );
}
