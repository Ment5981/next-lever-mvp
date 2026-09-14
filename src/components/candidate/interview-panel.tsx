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

/**
 * 模拟面试面板。
 *
 * 三道门禁在界面上都看得见：语音回答必须先确认转写、每题摘要必须由本人确认、
 * 至少回答 3 题才能完成。回答只做事实压缩，不做任何语音特征或情绪分析。
 */
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
      title="模拟面试"
      subtitle="回答 3 到 5 个岗位问题。"
      aside={
        <Badge tone={interview?.completed ? "good" : "warn"}>
          {interview?.completed ? "面试已完成确认" : "面试未完成"}
        </Badge>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs text-slate-500">目标岗位</span>
            <select
              value={targetJob}
              onChange={(event) => onTargetJobChange(event.target.value)}
              className="mt-1 max-w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
            >
              {jobs.map((job) => (
                <option key={job.job_version_id} value={job.job_version_id}>
                  {job.company_name} · {job.title}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="secondary"
            onClick={() =>
              onAction(
                {
                  action: "generate",
                  target_job_version_id: targetJob || null,
                },
                "generate",
              )
            }
            busy={busy === "generate"}
          >
            生成面试问题
          </Button>
        </div>

        {turns.length === 0 && (
          <Notice tone="info">
            还没有面试问题。预置演示状态里已经有 5 组确认过的问答，重新生成会覆盖当前会话。
          </Notice>
        )}

        {turns.map((turn, index) => (
          <div
            key={turn.turn_id}
            className="space-y-3 rounded-xl border border-slate-200 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">问题 {index + 1}</Badge>
              <Badge tone={turn.answer_mode === "voice" ? "info" : "neutral"}>
                {turn.answer_mode === "voice" ? "语音回答" : "文字回答"}
              </Badge>
              {turn.answer_mode === "voice" && (
                <Badge tone={turn.transcript_confirmed ? "good" : "warn"}>
                  {turn.transcript_confirmed ? "转写已确认" : "转写未确认"}
                </Badge>
              )}
              <Badge tone={turn.summary_confirmed ? "good" : "warn"}>
                {turn.summary_confirmed ? "摘要已确认" : "摘要待确认"}
              </Badge>
            </div>

            <p className="text-sm font-medium break-words text-slate-900">
              {turn.question}
            </p>

            <textarea
              value={answerDraft[turn.turn_id] ?? turn.raw_answer}
              onChange={(event) => {
                setAnswerDraft((prev) => ({
                  ...prev,
                  [turn.turn_id]: event.target.value,
                }));
                setVoiceTurn((prev) => ({ ...prev, [turn.turn_id]: false }));
              }}
              rows={4}
              placeholder="用具体过程和结果回答，越具体证据等级越高"
              className="w-full rounded-lg border border-slate-300 p-2 text-sm leading-relaxed"
            />

            <VoiceInput
              label={`语音回答问题 ${index + 1}`}
              confirmLabel="确认转写并填入回答"
              onConfirm={(text) => {
                setAnswerDraft((prev) => {
                  const existing = prev[turn.turn_id] ?? turn.raw_answer;
                  return {
                    ...prev,
                    [turn.turn_id]: existing ? `${existing}\n${text}` : text,
                  };
                });
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
                    raw_answer: answerDraft[turn.turn_id] ?? turn.raw_answer,
                    transcript_confirmed: voiceTurn[turn.turn_id] ?? false,
                  },
                  `answer-${turn.turn_id}`,
                )
              }
              busy={busy === `answer-${turn.turn_id}`}
              disabled={
                (answerDraft[turn.turn_id] ?? turn.raw_answer).trim().length === 0
              }
            >
              提交回答并生成摘要
            </Button>

            {turn.answer_summary && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  事实摘要（可在确认前修正，确认的是你最终看到的这段文字）
                </p>
                <textarea
                  value={summaryDraft[turn.turn_id] ?? turn.answer_summary}
                  onChange={(event) =>
                    setSummaryDraft((prev) => ({
                      ...prev,
                      [turn.turn_id]: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                />
                <Button
                  onClick={() =>
                    onAction(
                      {
                        action: "confirm_summary",
                        turn_id: turn.turn_id,
                        answer_summary:
                          summaryDraft[turn.turn_id] ?? turn.answer_summary,
                      },
                      `summary-${turn.turn_id}`,
                    )
                  }
                  busy={busy === `summary-${turn.turn_id}`}
                >
                  确认这段摘要
                </Button>
              </div>
            )}
          </div>
        ))}

        <Blockers items={blockers} />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => onAction({ action: "complete" }, "complete")}
            busy={busy === "complete"}
            disabled={
              answered.length < 3 || summariesConfirmed.length < answered.length
            }
          >
            完成模拟面试
          </Button>
          <span className="text-xs break-words text-slate-500">
            已回答 {answered.length} 题，已确认摘要 {summariesConfirmed.length} 条，
            至少需要 3 题且每题摘要都确认
          </span>
        </div>
      </div>
    </Panel>
  );
}
