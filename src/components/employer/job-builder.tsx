"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { VoiceInput } from "@/components/voice-input";
import { Badge, Blockers, Notice, Panel, type Tone } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { validateWeights } from "@/lib/engine/scoring";
import { CRITERION_TYPE_TEXT, type CriterionType } from "@/lib/schema/enums";
import type {
  ClarifyingQuestion,
  CompetencyCriterion,
  JobAttachment,
  JobVersion,
} from "@/lib/schema/domain";
import type { ProviderCallMeta } from "@/lib/providers/types";

type JobDraft = {
  job_id: string;
  company_name: string;
  company_profile_url: string;
  attachments: JobAttachment[];
  title: string;
  summary: string;
  raw_input: string;
  input_mode: "text" | "voice";
  transcript_confirmed: boolean;
  created_at: string;
  clarifications: ClarifyingQuestion[];
  criteria: CompetencyCriterion[];
};

type JobAttachmentPreview = JobAttachment & {
  id: string;
  preview_url: string;
};

let localAttachmentSequence = 0;

function attachmentId() {
  localAttachmentSequence += 1;
  return `job_file_local_${localAttachmentSequence}`;
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

const CRITERION_TYPES = Object.keys(CRITERION_TYPE_TEXT) as CriterionType[];

const MODE_TONE: Record<ProviderCallMeta["mode"], Tone> = {
  live: "good",
  mock: "demo",
  fallback: "warn",
};

export function JobBuilder({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [companyName, setCompanyName] = useState("");
  const [companyProfileUrl, setCompanyProfileUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [transcriptConfirmed, setTranscriptConfirmed] = useState(false);
  const [attachments, setAttachments] = useState<JobAttachmentPreview[]>([]);
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [providerMeta, setProviderMeta] = useState<ProviderCallMeta | null>(null);
  const [confirmed, setConfirmed] = useState<JobVersion | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<"draft" | "confirm" | "publish" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<JobAttachmentPreview[]>([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(
    () => () => {
      attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.preview_url));
    },
    [],
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const available = Math.max(0, 6 - attachments.length);
    const next = Array.from(fileList)
      .filter(
        (file) =>
          (file.type === "application/pdf" || file.type.startsWith("image/")) &&
          file.size <= 20 * 1024 * 1024,
      )
      .slice(0, available)
      .map((file) => ({
        id: attachmentId(),
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        preview_url: URL.createObjectURL(file),
      }));
    setAttachments((prev) => [...prev, ...next]);
    if (fileList.length !== next.length) {
      setNotice("仅支持 PDF 或图片，单个文件不超过 20 MB，最多 6 份。 ");
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.preview_url);
      return prev.filter((entry) => entry.id !== id);
    });
  }

  const weights = draft
    ? validateWeights(draft.criteria)
    : { ok: false, total: 0, message: "" };

  async function generateDraft() {
    setBusy("draft");
    setConfirmed(null);
    setNotice("");
    const result = await callApi<{ draft: JobDraft; provider: ProviderCallMeta }>(
      "/api/employer/job/draft",
      {
        company_name: companyName,
        company_profile_url: companyProfileUrl,
        attachments: attachments.map((file) => ({
          file_name: file.file_name,
          mime_type: file.mime_type,
          size_bytes: file.size_bytes,
        })),
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
        company_profile_url: draft.company_profile_url,
        attachments: draft.attachments,
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

  async function publishJob() {
    if (!confirmed) return;
    setBusy("publish");
    const result = await callApi<{ job: JobVersion }>(
      "/api/employer/job/publish",
      {
        job_version_id: confirmed.job_version_id,
        published: !confirmed.published,
      },
    );
    if (result.ok) {
      setConfirmed(result.data.job);
      setBlockers([]);
      setNotice(result.data.job.published ? "岗位 Agent 已发布到求职广场。" : "岗位 Agent 已从求职广场撤下。");
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
        title="描述岗位"
        subtitle="语音转写确认后才能继续。"
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
            <label className="block">
              <span className="text-sm text-slate-700">公司详情链接（可选）</span>
              <input
                type="url"
                value={companyProfileUrl}
                onChange={(event) => setCompanyProfileUrl(event.target.value)}
                placeholder="https://example.com/about"
                className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm"
              />
              <span className="mt-1 block text-xs text-slate-400">用于记录公司背景来源，不会自动抓取网页。</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

          <div className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">岗位参考材料</p>
                <p className="mt-1 text-xs text-slate-500">上传岗位说明、团队介绍或业务资料，支持 PDF、JPG、PNG，立即预览。</p>
              </div>
              <Button variant="secondary" onClick={() => inputRef.current?.click()} className="w-full sm:w-auto">
                添加文件
              </Button>
              <input
                ref={inputRef}
                id="employer-job-attachment"
                type="file"
                accept="application/pdf,image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {attachments.map((file) => (
                  <div key={file.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="relative h-32 bg-slate-50">
                      {file.mime_type === "application/pdf" ? (
                        <iframe title={file.file_name} src={file.preview_url} className="size-full border-0" />
                      ) : (
                        // Blob URLs are created in the browser and cannot use the Next image optimizer.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={file.preview_url} alt={file.file_name} className="size-full object-contain" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        aria-label={`移除 ${file.file_name}`}
                        className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-slate-900/70 text-sm text-white hover:bg-slate-900"
                      >
                        ×
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3 text-xs">
                      <span className="truncate font-medium text-slate-700">{file.file_name}</span>
                      <span className="shrink-0 text-slate-400">{formatFileSize(file.size_bytes)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-sm text-slate-700">
              岗位描述与证据要求
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
          {notice && <Notice tone="info">{notice}</Notice>}

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
            title="回答关键追问"
            subtitle={`${draft.clarifications.length} 个问题，可跳过。`}
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
            title="编辑能力模型"
            subtitle="调整能力、权重与硬性条件。"
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
                      硬性条件
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
              <Badge tone={confirmed.published ? "good" : "warn"}>
                {confirmed.published ? "已发布" : "未发布"}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed break-words text-slate-700">
              {confirmed.company_name} · {confirmed.title}
            </p>
            <Notice tone="info">
              旧版本保留，重新确认会生成新版本。Agent Card：
              Agent Card 可以在
              <Link
                className="mx-1 underline"
                href={`/api/a2a/job/${confirmed.job_version_id}/card`}
              >
                这里
              </Link>
              查看。
            </Notice>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={publishJob} busy={busy === "publish"}>
                {confirmed.published ? "撤下岗位" : "发布到求职广场"}
              </Button>
              {notice && <Notice tone="good">{notice}</Notice>}
            </div>
          </div>
        </Panel>
      )}

      <Panel
        title="平台内已有岗位"
        subtitle="三个岗位，三种判断侧重。"
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
