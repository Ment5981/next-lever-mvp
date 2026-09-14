"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import {
  Badge,
  Blockers,
  Notice,
  Panel,
  Quote,
  type Tone,
} from "@/components/ui";
import {
  InterviewPanel,
  type InterviewAction,
} from "@/components/candidate/interview-panel";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import {
  EVIDENCE_LEVEL_TEXT,
  SOURCE_LABEL_TEXT,
  type EvidenceLevel,
} from "@/lib/schema/enums";
import type {
  Evidence,
  InterviewSession,
  PortfolioItem,
} from "@/lib/schema/domain";
import type { ProviderCallMeta } from "@/lib/providers/types";

const LEVELS = Object.keys(EVIDENCE_LEVEL_TEXT) as EvidenceLevel[];

const MODE_TONE: Record<ProviderCallMeta["mode"], Tone> = {
  live: "good",
  mock: "demo",
  fallback: "warn",
};

type MaterialAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string;
};

let localSeq = 0;
function localId(prefix: string) {
  localSeq += 1;
  return `${prefix}_local_${localSeq}`;
}

function formatFileSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/** 求职者首步：准备材料，确认后进入 AI 模拟面试。 */
export function MaterialsWorkbench({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [resumeText, setResumeText] = useState(initial.candidate.resume_text);
  const [projectText, setProjectText] = useState(initial.candidate.project_text);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(initial.candidate.portfolio);
  const [evidence, setEvidence] = useState<Evidence[]>(initial.candidate.evidence);
  const [attachments, setAttachments] = useState<MaterialAttachment[]>([]);
  const [interview, setInterview] = useState<InterviewSession | null>(initial.interview);
  const [targetJob, setTargetJob] = useState(
    initial.interview.target_job_version_id ?? initial.jobs[0]?.job_version_id ?? "",
  );
  const [extractMeta, setExtractMeta] = useState<ProviderCallMeta | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [interviewBlockers, setInterviewBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<MaterialAttachment[]>([]);

  const confirmedCount = evidence.filter((item) => item.confirmed).length;
  const materialsConfirmed = state.candidate.materials_confirmed;
  const hasTextMaterials = Boolean(resumeText.trim() || projectText.trim());

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(
    () => () => {
      attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    [],
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const next = Array.from(fileList)
      .filter((file) => file.type === "application/pdf" || file.type.startsWith("image/"))
      .slice(0, 6 - attachments.length)
      .map((file) => ({
        id: localId("file"),
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
      }));
    setAttachments((prev) => [...prev, ...next]);
    if (fileList.length !== next.length) {
      setNotice("仅支持 PDF 或图片，最多预览 6 份材料。");
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((entry) => entry.id !== id);
    });
  }

  async function extract() {
    setBusy("extract");
    setNotice("");
    const result = await callApi<{ evidence: Evidence[]; provider: ProviderCallMeta }>(
      "/api/candidate/extract",
      { resume_text: resumeText, project_text: projectText },
    );
    if (result.ok) {
      setEvidence((prev) => [...prev, ...result.data.evidence]);
      setExtractMeta(result.data.provider);
      setBlockers([]);
      setNotice(`已找到 ${result.data.evidence.length} 条待确认事实。`);
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  async function saveMaterials(confirm: boolean) {
    setBusy(confirm ? "confirm" : "save");
    setNotice("");
    const result = await callApi<unknown>("/api/candidate/materials", {
      resume_text: resumeText,
      project_text: projectText,
      portfolio,
      evidence,
      materials_confirmed: confirm,
    });
    if (result.ok) {
      setBlockers([]);
      setNotice(confirm ? "材料已确认，开始下一步。" : "草稿已保存。");
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  async function runInterviewAction(action: InterviewAction, key: string) {
    setBusy(key);
    setInterviewBlockers([]);
    const result = await callApi<{ interview: InterviewSession }>(
      "/api/candidate/interview",
      action,
    );
    if (result.ok) {
      setInterview(result.data.interview);
      await refresh();
    } else {
      setInterviewBlockers(result.blockers);
    }
    setBusy(null);
    return result.ok;
  }

  function patchEvidence(id: string, patch: Partial<Evidence>) {
    setEvidence((prev) =>
      prev.map((item) =>
        item.evidence_id === id ? { ...item, ...patch, edited_by_user: true } : item,
      ),
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-medium text-indigo-700">建立 Agent</span>
        <span aria-hidden="true">→</span>
        <span className={materialsConfirmed ? "font-medium text-emerald-700" : ""}>确认材料</span>
        <span aria-hidden="true">→</span>
        <span className={interview?.completed ? "font-medium text-emerald-700" : ""}>AI 模拟面试</span>
        <span aria-hidden="true">→</span>
        <span>发布到广场</span>
      </div>

      <Panel
        title="准备我的 Agent"
        subtitle="上传或粘贴材料，先让 AI 认识你。"
        aside={<Badge tone={materialsConfirmed ? "good" : "accent"}>{materialsConfirmed ? "已确认" : "进行中"}</Badge>}
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <label
              htmlFor="candidate-material-upload"
              className="flex min-h-24 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/60 p-4 transition hover:border-indigo-500 hover:bg-indigo-50"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-xl text-indigo-600 shadow-sm">↑</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">上传简历或作品</span>
                <span className="mt-1 block text-xs text-slate-500">支持 PDF、JPG、PNG · 可即时预览</span>
              </span>
              <input
                ref={inputRef}
                id="candidate-material-upload"
                type="file"
                accept="application/pdf,image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <Button variant="secondary" onClick={() => inputRef.current?.click()} className="w-full sm:w-auto">
              选择文件
            </Button>
          </div>

          {attachments.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attachments.map((file) => (
                <div key={file.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="relative h-36 bg-white">
                    {file.type === "application/pdf" ? (
                      <iframe title={file.name} src={file.previewUrl} className="size-full border-0" />
                    ) : (
                      // Blob URLs are created in the browser and cannot use the Next image optimizer.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.previewUrl} alt={file.name} className="size-full object-contain" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(file.id)}
                      aria-label={`移除 ${file.name}`}
                      className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-slate-900/70 text-sm text-white hover:bg-slate-900"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 text-xs">
                    <span className="truncate font-medium text-slate-700">{file.name}</span>
                    <span className="shrink-0 text-slate-400">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <details className="group rounded-2xl border border-slate-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
              <span>编辑文字材料</span>
              <span className="text-xs text-slate-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="space-y-4 border-t border-slate-100 p-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-600">简历</span>
                <textarea
                  value={resumeText}
                  onChange={(event) => setResumeText(event.target.value)}
                  rows={6}
                  placeholder="粘贴简历内容"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-600">项目与经历</span>
                <textarea
                  value={projectText}
                  onChange={(event) => setProjectText(event.target.value)}
                  rows={5}
                  placeholder="补充项目、作品和结果"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed outline-none focus:border-indigo-400"
                />
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-600">作品链接</span>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setPortfolio((prev) => [
                        ...prev,
                        { item_id: localId("pf"), title: "", url: "", note: "", confirmed: false },
                      ])
                    }
                    className="min-h-8 px-2 text-xs"
                  >
                    添加链接
                  </Button>
                </div>
                {portfolio.map((item, index) => (
                  <div key={item.item_id} className="space-y-2 rounded-xl border border-slate-200 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        value={item.title}
                        onChange={(event) =>
                          setPortfolio((prev) => prev.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                        }
                        placeholder="作品名称"
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                      />
                      <input
                        value={item.url}
                        onChange={(event) =>
                          setPortfolio((prev) => prev.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry)))
                        }
                        placeholder="链接"
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                      />
                    </div>
                    <textarea
                      value={item.note}
                      onChange={(event) =>
                        setPortfolio((prev) => prev.map((entry, i) => (i === index ? { ...entry, note: event.target.value } : entry)))
                      }
                      rows={2}
                      placeholder="它能证明什么？"
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={item.confirmed}
                          onChange={(event) =>
                            setPortfolio((prev) => prev.map((entry, i) => (i === index ? { ...entry, confirmed: event.target.checked } : entry)))
                          }
                          className="size-4"
                        />
                        允许共享
                      </label>
                      <Button
                        variant="danger"
                        onClick={() => setPortfolio((prev) => prev.filter((_, i) => i !== index))}
                        className="min-h-8 px-2 text-xs"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>

          <details className="group rounded-2xl border border-slate-200">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                查看并确认事实
                <Badge tone={confirmedCount > 0 ? "good" : "neutral"}>{confirmedCount} 条</Badge>
              </span>
              <span className="text-xs text-slate-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="space-y-4 border-t border-slate-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={extract} busy={busy === "extract"} disabled={!hasTextMaterials}>
                  提取事实
                </Button>
                <Button variant="secondary" onClick={() => void saveMaterials(false)} busy={busy === "save"}>
                  保存草稿
                </Button>
                {extractMeta && <Badge tone={MODE_TONE[extractMeta.mode]}>{extractMeta.note}</Badge>}
              </div>
              {evidence.length === 0 ? (
                <Notice tone="neutral">确认后的事实才会进入你的 Agent。</Notice>
              ) : (
                evidence.map((item) => (
                  <div key={item.evidence_id} className={`space-y-3 rounded-xl border p-3 ${item.confirmed ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.confirmed ? "good" : "warn"}>{item.confirmed ? "已确认" : "待确认"}</Badge>
                      <Badge tone="neutral">{SOURCE_LABEL_TEXT[item.source]}</Badge>
                      {item.edited_by_user && <Badge tone="info">已修改</Badge>}
                    </div>
                    <textarea
                      value={item.claim}
                      onChange={(event) => patchEvidence(item.evidence_id, { claim: event.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                    />
                    <Quote text={item.quote} source={`原文 · ${item.material_ref}`} />
                    <div className="flex flex-wrap items-end gap-2">
                      <label className="block">
                        <span className="text-xs text-slate-500">证据等级</span>
                        <select
                          value={item.level}
                          onChange={(event) => patchEvidence(item.evidence_id, { level: event.target.value as EvidenceLevel })}
                          className="mt-1 rounded-lg border border-slate-300 bg-white p-2 text-sm"
                        >
                          {LEVELS.map((level) => <option key={level} value={level}>{EVIDENCE_LEVEL_TEXT[level]}</option>)}
                        </select>
                      </label>
                      <Button
                        variant={item.confirmed ? "secondary" : "primary"}
                        onClick={() =>
                          setEvidence((prev) => prev.map((entry) => entry.evidence_id === item.evidence_id ? { ...entry, confirmed: !entry.confirmed, source: !entry.confirmed ? "CandidateFact" : "CandidateClaim" } : entry))
                        }
                      >
                        {item.confirmed ? "取消确认" : "确认事实"}
                      </Button>
                      <Button variant="danger" onClick={() => setEvidence((prev) => prev.filter((entry) => entry.evidence_id !== item.evidence_id))}>删除</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </details>

          {notice && <Notice tone="info">{notice}</Notice>}
          <Blockers items={blockers} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <span className="text-xs text-slate-500">
              {hasTextMaterials ? `${confirmedCount} 条事实待确认` : "请先粘贴文字材料"}
            </span>
            <Button
              onClick={() => void saveMaterials(true)}
              busy={busy === "confirm"}
              disabled={confirmedCount === 0 || !hasTextMaterials}
            >
              确认材料并继续
            </Button>
          </div>
        </div>
      </Panel>

      <InterviewPanel
        jobs={state.jobs}
        interview={interview}
        targetJob={targetJob}
        onTargetJobChange={setTargetJob}
        onAction={runInterviewAction}
        busy={busy}
        blockers={interviewBlockers}
      />

      <Panel title="发布我的 Agent">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">完成材料和 AI 面试后，去广场认识合适的岗位。</p>
          <Link
            href="/candidate/agent"
            className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            去发布
          </Link>
        </div>
      </Panel>
    </>
  );
}
