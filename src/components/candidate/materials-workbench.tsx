"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { VoiceInput } from "@/components/voice-input";
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

let localSeq = 0;
function localId(prefix: string) {
  localSeq += 1;
  return `${prefix}_local_${localSeq}`;
}

/**
 * 求职者材料工作台。
 *
 * 三条硬约束在界面上是可见的：提取出的每条事实都带原文引用且默认未确认，
 * 未确认的事实不会进入 Agent；语音输入必须先看转写再确认；
 * 只有材料确认通过门禁后才允许进入下一步。
 */
export function MaterialsWorkbench({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);

  // 草稿从首屏快照初始化一次，之后由用户编辑，刷新快照不会覆盖正在编辑的内容。
  const [resumeText, setResumeText] = useState(initial.candidate.resume_text);
  const [projectText, setProjectText] = useState(initial.candidate.project_text);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(
    initial.candidate.portfolio,
  );
  const [evidence, setEvidence] = useState<Evidence[]>(
    initial.candidate.evidence,
  );
  const [interview, setInterview] = useState<InterviewSession | null>(
    initial.interview,
  );
  const [targetJob, setTargetJob] = useState(
    initial.interview.target_job_version_id ??
      initial.jobs[0]?.job_version_id ??
      "",
  );
  const [extractMeta, setExtractMeta] = useState<ProviderCallMeta | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [interviewBlockers, setInterviewBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const confirmedCount = evidence.filter((e) => e.confirmed).length;
  const materialsConfirmed = state.candidate.materials_confirmed;

  async function extract() {
    setBusy("extract");
    setNotice("");
    const result = await callApi<{
      evidence: Evidence[];
      provider: ProviderCallMeta;
    }>("/api/candidate/extract", {
      resume_text: resumeText,
      project_text: projectText,
    });
    if (result.ok) {
      // 追加而不是替换：已确认过的事实不会因为再次提取而丢失。
      setEvidence((prev) => [...prev, ...result.data.evidence]);
      setExtractMeta(result.data.provider);
      setBlockers([]);
      setNotice(
        `提取到 ${result.data.evidence.length} 条事实草稿，逐条核对原文后再确认。`,
      );
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
      setNotice(confirm ? "材料已确认，可以进入模拟面试。" : "材料草稿已保存。");
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
        item.evidence_id === id
          ? { ...item, ...patch, edited_by_user: true }
          : item,
      ),
    );
  }

  return (
    <>
      <Panel
        title="第一步：粘贴简历、项目材料与作品链接"
        subtitle="材料只在服务端内存里用于本次演示，不落盘、不记录完整简历。语音入口只做转写，不上传音频。"
        aside={
          <Badge tone={materialsConfirmed ? "good" : "warn"}>
            {materialsConfirmed ? "材料已确认" : "材料未确认"}
          </Badge>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-800">简历文本</span>
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={8}
              placeholder="粘贴简历纯文本。写清过程、数字和产出，证据等级会更高。"
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed"
            />
          </label>

          <VoiceInput
            label="语音补充简历内容"
            confirmLabel="确认转写并追加到简历"
            onConfirm={(text) =>
              setResumeText((prev) => (prev ? `${prev}\n${text}` : text))
            }
          />

          <label className="block">
            <span className="text-sm font-medium text-slate-800">项目材料</span>
            <textarea
              value={projectText}
              onChange={(event) => setProjectText(event.target.value)}
              rows={6}
              placeholder="项目背景、你的具体动作、可验证的结果。"
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed"
            />
          </label>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">作品链接</span>
              <Button
                variant="secondary"
                onClick={() =>
                  setPortfolio((prev) => [
                    ...prev,
                    {
                      item_id: localId("pf"),
                      title: "",
                      url: "",
                      note: "",
                      confirmed: false,
                    },
                  ])
                }
              >
                添加一项作品
              </Button>
            </div>
            {portfolio.length === 0 && (
              <Notice tone="neutral">
                没有作品链接也能继续。没有可运行链接的项目会被标注为证据不足，
                不会被写成不具备能力。
              </Notice>
            )}
            {portfolio.map((item, index) => (
              <div
                key={item.item_id}
                className="space-y-2 rounded-xl border border-slate-200 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={item.title}
                    onChange={(event) =>
                      setPortfolio((prev) =>
                        prev.map((p, i) =>
                          i === index ? { ...p, title: event.target.value } : p,
                        ),
                      )
                    }
                    placeholder="作品名称"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                  />
                  <input
                    value={item.url}
                    onChange={(event) =>
                      setPortfolio((prev) =>
                        prev.map((p, i) =>
                          i === index ? { ...p, url: event.target.value } : p,
                        ),
                      )
                    }
                    placeholder="可访问链接，没有就留空"
                    className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                  />
                </div>
                <textarea
                  value={item.note}
                  onChange={(event) =>
                    setPortfolio((prev) =>
                      prev.map((p, i) =>
                        i === index ? { ...p, note: event.target.value } : p,
                      ),
                    )
                  }
                  rows={2}
                  placeholder="说明这份作品能证明什么"
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={item.confirmed}
                      onChange={(event) =>
                        setPortfolio((prev) =>
                          prev.map((p, i) =>
                            i === index
                              ? { ...p, confirmed: event.target.checked }
                              : p,
                          ),
                        )
                      }
                      className="size-4"
                    />
                    我确认这项作品可以共享
                  </label>
                  <Button
                    variant="danger"
                    onClick={() =>
                      setPortfolio((prev) => prev.filter((_, i) => i !== index))
                    }
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <Panel
        title="第二步：核对提取出的事实"
        subtitle="每条事实都保留原文引用片段。你可以修改表述、调整证据等级、确认或删除；未确认的事实不会进入 Agent。"
        aside={
          <div className="flex flex-wrap items-center gap-2">
            {extractMeta && (
              <Badge tone={MODE_TONE[extractMeta.mode]}>
                提取来源：{extractMeta.note}
              </Badge>
            )}
            <Badge tone={confirmedCount > 0 ? "good" : "warn"}>
              已确认 {confirmedCount} / {evidence.length} 条
            </Badge>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={extract} busy={busy === "extract"}>
              从材料中提取事实
            </Button>
            <Button
              variant="secondary"
              onClick={() => void saveMaterials(false)}
              busy={busy === "save"}
            >
              仅保存草稿
            </Button>
          </div>

          {notice && <Notice tone="info">{notice}</Notice>}
          <Blockers items={blockers} />

          {evidence.length === 0 && (
            <Notice tone="neutral">
              还没有事实条目。点击上面的按钮从材料中提取，或先粘贴材料再提取。
            </Notice>
          )}

          {evidence.map((item) => (
            <div
              key={item.evidence_id}
              className={`space-y-3 rounded-xl border p-3 ${
                item.confirmed
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.confirmed ? "good" : "warn"}>
                  {item.confirmed ? "已确认" : "待确认"}
                </Badge>
                <Badge tone="neutral">{SOURCE_LABEL_TEXT[item.source]}</Badge>
                {item.edited_by_user && <Badge tone="info">本人已修改</Badge>}
              </div>

              <label className="block">
                <span className="text-xs text-slate-500">事实表述</span>
                <textarea
                  value={item.claim}
                  onChange={(event) =>
                    patchEvidence(item.evidence_id, { claim: event.target.value })
                  }
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                />
              </label>

              <Quote
                text={item.quote}
                source={`原文引用 · ${item.material_ref}`}
                meta="引用片段只用于你核对提取是否准确"
              />

              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="text-xs text-slate-500">证据等级</span>
                  <select
                    value={item.level}
                    onChange={(event) =>
                      patchEvidence(item.evidence_id, {
                        level: event.target.value as EvidenceLevel,
                      })
                    }
                    className="mt-1 max-w-full rounded-lg border border-slate-300 bg-white p-2 text-sm"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {EVIDENCE_LEVEL_TEXT[level]}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  variant={item.confirmed ? "secondary" : "primary"}
                  onClick={() =>
                    setEvidence((prev) =>
                      prev.map((e) =>
                        e.evidence_id === item.evidence_id
                          ? {
                              ...e,
                              confirmed: !e.confirmed,
                              source: !e.confirmed
                                ? "CandidateFact"
                                : "CandidateClaim",
                            }
                          : e,
                      ),
                    )
                  }
                >
                  {item.confirmed ? "取消确认" : "确认这条事实"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() =>
                    setEvidence((prev) =>
                      prev.filter((e) => e.evidence_id !== item.evidence_id),
                    )
                  }
                >
                  删除
                </Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
            <Button
              onClick={() => void saveMaterials(true)}
              busy={busy === "confirm"}
              disabled={confirmedCount === 0}
            >
              确认材料
            </Button>
            <span className="text-xs break-words text-slate-500">
              至少确认一条事实，且提供简历文本或项目材料
            </span>
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

      <Panel title="下一步">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/candidate/agent"
            className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            前往 Agent 与授权
          </Link>
          <span className="text-xs break-words text-slate-500">
            材料确认 + 面试完成 + 披露范围确认，三项齐全才能生成可投递 Agent
          </span>
        </div>
      </Panel>
    </>
  );
}
