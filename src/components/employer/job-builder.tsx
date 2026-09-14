"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { VoiceInput } from "@/components/voice-input";
import { Badge, Blockers, Notice, Panel, type Tone } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { validateWeights } from "@/lib/engine/scoring";
import { CRITERION_TYPE_TEXT, type CriterionType } from "@/lib/schema/enums";
import type { ClarifyingQuestion, CompetencyCriterion, JobVersion } from "@/lib/schema/domain";
import type { ProviderCallMeta } from "@/lib/providers/types";

type JobDraft = {
  job_id: string;
  company_name: string;
  title: string;
  summary: string;
  raw_input: string;
  input_mode: "text" | "voice";
  transcript_confirmed: boolean;
  created_at: string;
  clarifications: ClarifyingQuestion[];
  criteria: CompetencyCriterion[];
};

const CRITERION_TYPES = Object.keys(CRITERION_TYPE_TEXT) as CriterionType[];

const MODE_TONE: Record<ProviderCallMeta["mode"], Tone> = {
  live: "good",
  mock: "demo",
  fallback: "warn",
};

export function JobBuilder({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [companyName, setCompanyName] = useState("");
  const [rawText, setRawText] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [transcriptConfirmed, setTranscriptConfirmed] = useState(false);
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [providerMeta, setProviderMeta] = useState<ProviderCallMeta | null>(null);
  const [confirmed, setConfirmed] = useState<JobVersion | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [busy, setBusy] = useState<"draft" | "confirm" | null>(null);

  const weights = draft
    ? validateWeights(draft.criteria)
    : { ok: false, total: 0, message: "" };

  async function generateDraft() {
    setBusy("draft");
    setConfirmed(null);
    const result = await callApi<{ draft: JobDraft; provider: ProviderCallMeta }>(
      "/api/employer/job/draft",
      {
        company_name: companyName,
        raw_text: rawText,
        input_mode: inputMode,
        transcript_confirmed: transcriptConfirmed,
      },
    );
    if (result.ok) {
      setDraft(result.data.draft);
      setProviderMeta(result.data.provider);
      setBlockers([]);
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  function patchCriterion(index: number, patch: Partial<CompetencyCriterion>) {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            criteria: prev.criteria.map((c, i) =>
              i === index ? { ...c, ...patch } : c,
            ),
          }
        : prev,
    );
  }

  function removeCriterion(index: number) {
    setDraft((prev) =>
      prev
        ? { ...prev, criteria: prev.criteria.filter((_, i) => i !== index) }
        : prev,
    );
  }

  /** 把剩余权重平均补到各项，帮招聘方快速凑满 100%。 */
  function distributeWeights() {
    setDraft((prev) => {
      if (!prev || prev.criteria.length === 0) return prev;
      const count = prev.criteria.length;
      const base = Math.floor((100 / count) * 100) / 100;
      const criteria = prev.criteria.map((c) => ({ ...c, weight: base }));
      const drift = Math.round((100 - base * count) * 100) / 100;
      criteria[0] = {
        ...criteria[0],
        weight: Math.round((criteria[0].weight + drift) * 100) / 100,
      };
      return { ...prev, criteria };
    });
  }

  async function confirmJob() {
    if (!draft) return;
    setBusy("confirm");
    const result = await callApi<{ job: JobVersion; note: string }>(
      "/api/employer/job/confirm",
      {
        job_id: draft.job_id,
        company_name: draft.company_name,
        title: draft.title,
        raw_input: draft.raw_input,
        input_mode: draft.input_mode,
        transcript_confirmed: draft.transcript_confirmed,
        summary: draft.summary,
        criteria: draft.criteria,
        clarifications: draft.clarifications,
        created_at: draft.created_at,
      },
    );
    if (result.ok) {
      setConfirmed(result.data.job);
      setBlockers([]);
      setDraft(null);
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
          <p className="text-[11px] font-semibold tracking-wider text-indigo-600 uppercase">01 / 输入</p>
          <p className="mt-1 text-sm font-medium text-slate-900">把岗位讲清楚</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">02 / 生成</p>
          <p className="mt-1 text-sm font-medium text-slate-600">回答关键追问</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">03 / 确认</p>
          <p className="mt-1 text-sm font-medium text-slate-600">发布岗位版本</p>
        </div>
      </div>
      <Panel
        title="第一步：描述岗位"
        subtitle="语音入口是可选的。语音转写必须先确认，未确认的转写不会进入岗位模型。"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-700">公司名称</span>
              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="例如：启明智研"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              />
            </label>
            <div className="flex items-end gap-2">
              <Badge tone={inputMode === "voice" ? "info" : "neutral"}>
                当前输入方式：{inputMode === "voice" ? "语音转写" : "文字"}
              </Badge>
              {inputMode === "voice" && (
                <Badge tone={transcriptConfirmed ? "good" : "warn"}>
                  {transcriptConfirmed ? "转写已确认" : "转写未确认"}
                </Badge>
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-sm text-slate-700">
              岗位描述（职责、必须具备的条件、希望看到的证据）
            </span>
            <textarea
              value={rawText}
              onChange={(event) => {
                setRawText(event.target.value);
                setInputMode("text");
                setTranscriptConfirmed(false);
              }}
              rows={7}
              placeholder="例如：我们要招一个初级 AI 应用产品经理，需要能独立做用户访谈、把问题定义清楚，并推动一个功能从需求到上线……"
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed"
            />
          </label>

          <VoiceInput
            label="语音描述岗位"
            confirmLabel="确认转写并填入岗位描述"
            onConfirm={(text) => {
              setRawText((prev) => (prev ? `${prev}\n${text}` : text));
              setInputMode("voice");
              setTranscriptConfirmed(true);
            }}
          />

          <Blockers items={blockers} />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={generateDraft}
              busy={busy === "draft"}
              disabled={companyName.trim().length === 0 || rawText.trim().length < 10}
            >
              生成追问与能力模型
            </Button>
            {providerMeta && (
              <Badge tone={MODE_TONE[providerMeta.mode]}>
                岗位结构化：{providerMeta.note}
              </Badge>
            )}
          </div>
        </div>
      </Panel>

      {draft && (
        <>
          <Panel
            title="第二步：回答 AI 的有限追问"
            subtitle={`共 ${draft.clarifications.length} 个问题，都会说明为什么影响判断。可以先跳过，答案会随岗位版本一起留存。`}
          >
            <ol className="space-y-3">
              {draft.clarifications.map((question, index) => (
                <li
                  key={question.question_id}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="text-sm font-medium break-words text-slate-900">
                    {index + 1}. {question.question}
                  </p>
                  <p className="mt-1 text-xs break-words text-slate-500">
                    为什么影响判断：{question.why_it_matters}
                  </p>
                  <textarea
                    value={question.answer ?? ""}
                    onChange={(event) =>
                      setDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              clarifications: prev.clarifications.map((q, i) =>
                                i === index
                                  ? { ...q, answer: event.target.value }
                                  : q,
                              ),
                            }
                          : prev,
                      )
                    }
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
                  />
                </li>
              ))}
            </ol>
          </Panel>

          <Panel
            title="第三步：编辑能力模型"
            subtitle="每项都可以改名称、类型、权重、硬性条件、证据标准和评估问题。证据标准决定了求职者要拿什么来证明。"
            aside={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={weights.ok ? "good" : "bad"}>
                  权重合计 {weights.total}%
                </Badge>
                <Button variant="secondary" onClick={distributeWeights}>
                  平均分配
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              {!weights.ok && <Notice tone="warn">{weights.message}</Notice>}

              {draft.criteria.map((criterion, index) => (
                <div
                  key={criterion.criterion_id}
                  className="space-y-3 rounded-xl border border-slate-200 p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
                    <label className="block">
                      <span className="text-xs text-slate-500">能力名称</span>
                      <input
                        value={criterion.name}
                        onChange={(event) =>
                          patchCriterion(index, { name: event.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-500">类型</span>
                      <select
                        value={criterion.type}
                        onChange={(event) =>
                          patchCriterion(index, {
                            type: event.target.value as CriterionType,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                      >
                        {CRITERION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {CRITERION_TYPE_TEXT[type]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs text-slate-500">权重 %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={criterion.weight}
                        onChange={(event) =>
                          patchCriterion(index, {
                            weight: Number(event.target.value) || 0,
                          })
                        }
                        className="mt-1 w-24 rounded-lg border border-slate-300 p-2 text-sm"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs text-slate-500">描述</span>
                    <textarea
                      value={criterion.description}
                      onChange={(event) =>
                        patchCriterion(index, { description: event.target.value })
                      }
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs text-slate-500">
                      证据标准（求职者要拿什么来证明）
                    </span>
                    <textarea
                      value={criterion.evidence_standard}
                      onChange={(event) =>
                        patchCriterion(index, {
                          evidence_standard: event.target.value,
                        })
                      }
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs text-slate-500">
                      评估问题（每行一个，招聘方 Agent 会用它们追问）
                    </span>
                    <textarea
                      value={criterion.evaluation_questions.join("\n")}
                      onChange={(event) =>
                        patchCriterion(index, {
                          evaluation_questions: event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter((line) => line.length > 0)
                            .slice(0, 5),
                        })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={criterion.must_have}
                        onChange={(event) =>
                          patchCriterion(index, {
                            must_have: event.target.checked,
                          })
                        }
                        className="size-4"
                      />
                      硬性条件（不满足时不会被写成能力不足，而是标注未达标或证据不足）
                    </label>
                    <Button
                      variant="danger"
                      onClick={() => removeCriterion(index)}
                      disabled={draft.criteria.length <= 1}
                    >
                      删除该项
                    </Button>
                  </div>
                </div>
              ))}

              <Blockers items={blockers} />

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={confirmJob}
                  busy={busy === "confirm"}
                  disabled={!weights.ok}
                >
                  确认并生成岗位版本
                </Button>
                {!weights.ok && (
                  <span className="text-xs text-slate-500">
                    权重合计不是 100% 时无法确认
                  </span>
                )}
              </div>
            </div>
          </Panel>
        </>
      )}

      {confirmed && (
        <Panel title="岗位版本已生成">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge tone="good">{confirmed.job_version_id}</Badge>
              <Badge tone="neutral">版本 v{confirmed.version}</Badge>
              <Badge tone="accent">
                招聘方 Agent Card 已就绪
              </Badge>
            </div>
            <p className="text-sm leading-relaxed break-words text-slate-700">
              {confirmed.company_name} · {confirmed.title}
            </p>
            <Notice tone="info">
              旧版本会被保留，同一岗位再次确认只会追加新版本，不会静默覆盖已发出的评估口径。
              Agent Card 可以在
              <Link
                className="mx-1 underline"
                href={`/api/a2a/job/${confirmed.job_version_id}/card`}
              >
                这里
              </Link>
              查看。
            </Notice>
          </div>
        </Panel>
      )}

      <Panel
        title="平台内已有岗位"
        subtitle="预置案例的三个岗位在同一职能下侧重不同，用来展示同一份材料会得到不同结论。"
      >
        <ul className="space-y-3">
          {(state?.jobs ?? []).map((job) => (
            <li key={job.job_version_id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">{job.job_version_id}</Badge>
                <Badge tone="demo">演示数据</Badge>
              </div>
              <p className="mt-2 text-sm font-medium break-words text-slate-900">
                {job.company_name} · {job.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed break-words text-slate-600">
                {job.summary}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.criteria.map((criterion) => (
                  <Badge
                    key={criterion.criterion_id}
                    tone={criterion.must_have ? "warn" : "neutral"}
                  >
                    {criterion.name} {criterion.weight}%
                    {criterion.must_have ? " · 硬性" : ""}
                  </Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
