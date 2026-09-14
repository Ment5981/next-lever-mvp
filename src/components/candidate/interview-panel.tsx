"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { VoiceInput } from "@/components/voice-input";
import { Badge, Blockers, Notice, Panel } from "@/components/ui";
import type { InterviewSession, JobVersion } from "@/lib/schema/domain";

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

/** 岗位相关的 AI 面试。回答仍由用户确认后才进入求职者 Agent。 */
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
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [summaryDraft, setSummaryDraft] = useState<Record<string, string>>({});
  const [voiceTurn, setVoiceTurn] = useState<Record<string, boolean>>({});

  const turns = interview?.turns ?? [];
  const answered = turns.filter((turn) => turn.raw_answer.trim().length > 0);
  const summariesConfirmed = turns.filter((turn) => turn.summary_confirmed);

  return (
    <Panel
      title="AI 模拟面试"
      subtitle="让平台 Agent 先问你几道目标岗位的问题。"
      aside={
        <Badge tone={interview?.completed ? "good" : "accent"}>
          {interview?.completed ? "已完成" : "可开始"}
        </Badge>
      }
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#eef2ff_0%,#f8fafc_52%,#ecfeff_100%)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-lg text-white shadow-lg shadow-indigo-200">
                ✦
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">准备好了吗？</p>
                <p className="mt-1 text-xs text-slate-600">AI 会根据你的材料生成 3–5 个问题</p>
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
                  {jobs.map((job) => (
                    <option key={job.job_version_id} value={job.job_version_id}>
                      {job.company_name} · {job.title}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                onClick={() =>
                  onAction(
                    { action: "generate", target_job_version_id: targetJob || null },
                    "generate",
                  )
                }
                busy={busy === "generate"}
                className="min-h-10 whitespace-nowrap"
              >
                开始 AI 面试
              </Button>
            </div>
          </div>
        </div>

        {turns.length === 0 && (
          <Notice tone="neutral">点击上面的按钮，开始一次岗位模拟面试。</Notice>
        )}

        <div className="space-y-2">
          {turns.map((turn, index) => {
            const draft = answerDraft[turn.turn_id] ?? turn.raw_answer;
            const isCurrent = !turn.raw_answer.trim() || index === turns.length - 1;
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
                    <Badge tone={turn.raw_answer ? "good" : "accent"}>
                      {turn.raw_answer ? "已回答" : "等你回答"}
                    </Badge>
                    {turn.answer_summary && (
                      <Badge tone={turn.summary_confirmed ? "good" : "warn"}>
                        {turn.summary_confirmed ? "摘要已确认" : "摘要待确认"}
                      </Badge>
                    )}
                  </div>

                  <textarea
                    value={draft}
                    onChange={(event) => {
                      setAnswerDraft((prev) => ({ ...prev, [turn.turn_id]: event.target.value }));
                      setVoiceTurn((prev) => ({ ...prev, [turn.turn_id]: false }));
                    }}
                    rows={4}
                    placeholder="写下你的回答"
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
                  />

                  <VoiceInput
                    compact
                    label="用语音回答"
                    confirmLabel="确认转写"
                    onConfirm={(text) => {
                      setAnswerDraft((prev) => ({
                        ...prev,
                        [turn.turn_id]: draft ? `${draft}\n${text}` : text,
                      }));
                      setVoiceTurn((prev) => ({ ...prev, [turn.turn_id]: true }));
                    }}
                  />

                  <Button
                    variant="secondary"
                    onClick={() =>
                      onAction(
                        {
                          action: "answer",
                          turn_id: turn.turn_id,
                          answer_mode: voiceTurn[turn.turn_id] ? "voice" : "text",
                          raw_answer: draft,
                          transcript_confirmed: voiceTurn[turn.turn_id] ?? false,
                        },
                        `answer-${turn.turn_id}`,
                      )
                    }
                    busy={busy === `answer-${turn.turn_id}`}
                    disabled={draft.trim().length === 0}
                  >
                    提交回答
                  </Button>

                  {turn.answer_summary && (
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
                  )}
                </div>
              </details>
            );
          })}
        </div>

        <Blockers items={blockers} />

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <Button
            onClick={() => onAction({ action: "complete" }, "complete")}
            busy={busy === "complete"}
            disabled={answered.length < 3 || summariesConfirmed.length < answered.length}
          >
            完成面试
          </Button>
          <span className="text-xs text-slate-500">
            {answered.length}/{turns.length} 已回答 · {summariesConfirmed.length} 条摘要已确认
          </span>
        </div>
      </div>
    </Panel>
  );
}
