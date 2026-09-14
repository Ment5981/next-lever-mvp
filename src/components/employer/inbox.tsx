"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import {
  Badge,
  Blockers,
  Notice,
  Panel,
  Quote,
  Stat,
  type Tone,
} from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import {
  AGENT_SUGGESTION_TEXT,
  CRITERION_TYPE_TEXT,
  EVIDENCE_LEVEL_TEXT,
  HUMAN_DECISION_TEXT,
  SOURCE_LABEL_TEXT,
  type AgentSuggestion,
  type CriterionType,
  type HumanDecision,
} from "@/lib/schema/enums";
import type { CriterionAssessment, JobAssessment } from "@/lib/schema/domain";

const SUGGESTION_TONE: Record<AgentSuggestion, Tone> = {
  recommend_interview: "good",
  not_recommended_yet: "bad",
  human_review_required: "warn",
};

const DECISION_TONE: Record<HumanDecision, Tone> = {
  interview_invited: "good",
  not_invited: "bad",
  human_review: "warn",
};

const GAP_TEXT: Record<CriterionAssessment["gap_type"], string> = {
  none: "无明显缺口",
  evidence_missing: "证据不足",
  capability_gap: "能力缺口",
  unknown: "信息不足",
};

const GAP_TONE: Record<CriterionAssessment["gap_type"], Tone> = {
  none: "good",
  evidence_missing: "warn",
  capability_gap: "bad",
  unknown: "neutral",
};

const HARD_TEXT = {
  met: "满足",
  not_met: "不满足",
  insufficient_evidence: "证据不足，无法判定",
} as const;

const HARD_TONE = {
  met: "good",
  not_met: "bad",
  insufficient_evidence: "warn",
} as const;

const DECISIONS: HumanDecision[] = [
  "interview_invited",
  "not_invited",
  "human_review",
];

/** Agent 建议与真人决策一致时的对应关系，用于提示是否需要覆盖理由。 */
const ALIGNED: Record<AgentSuggestion, HumanDecision> = {
  recommend_interview: "interview_invited",
  not_recommended_yet: "not_invited",
  human_review_required: "human_review",
};

type DecisionDraft = {
  decision: HumanDecision | "";
  reason: string;
  override_reason: string;
  decided_by: string;
};

const EMPTY_DRAFT: DecisionDraft = {
  decision: "",
  reason: "",
  override_reason: "",
  decided_by: "招聘方负责人",
};

/**
 * 招聘方工作台。
 *
 * 证据矩阵按能力项列出评分、证据等级、引用的证据和缺口类型；
 * Agent 只给建议，真人决策单独存储，偏离建议时必须写覆盖理由。
 * 「证据不足」与「能力缺口」在界面上是两种不同的标签，不会被混为一谈。
 */
export function EmployerInbox({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [drafts, setDrafts] = useState<Record<string, DecisionDraft>>({});
  const [blockers, setBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const draftOf = (taskId: string) => drafts[taskId] ?? EMPTY_DRAFT;

  function patch(taskId: string, next: Partial<DecisionDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [taskId]: { ...draftOf(taskId), ...next },
    }));
  }

  async function submit(taskId: string) {
    const draft = draftOf(taskId);
    setBusy(taskId);
    setNotice("");
    const result = await callApi<unknown>("/api/employer/decision", {
      task_id: taskId,
      decision: draft.decision,
      reason: draft.reason,
      override_reason: draft.override_reason,
      decided_by: draft.decided_by,
    });
    if (result.ok) {
      setBlockers([]);
      setNotice("真人决策已记录，与 Agent 建议分开存储。");
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  if (state.assessments.length === 0) {
    return (
      <Panel title="还没有待确认的申请">
        <div className="space-y-3">
          <Notice tone="neutral">
            招聘方 Agent 还没有产出评估结果。请先完成授权并在 A2A 页面发送申请。
          </Notice>
          <Link
            href="/a2a"
            className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            前往 A2A 时间线
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <>
      <section className="command-strip p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-indigo-200 uppercase">
              human review desk
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Agent 给建议，招聘方做决定
            </h2>
          </div>
          <span className="text-xs text-indigo-100">{state.assessments.length} 个岗位等待确认</span>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <p className="text-xs text-indigo-200">需要真人确认</p>
            <p className="mt-1 text-2xl font-semibold text-white">{state.assessments.filter((item) => !state.decisions.some((d) => d.task_id === item.task_id)).length}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <p className="text-xs text-indigo-200">Agent 建议覆盖</p>
            <p className="mt-1 text-2xl font-semibold text-white">{state.assessments.filter((item) => item.info_insufficient).length}</p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-3">
            <p className="text-xs text-indigo-200">已完成真人决定</p>
            <p className="mt-1 text-2xl font-semibold text-white">{state.decisions.length}</p>
          </div>
        </div>
      </section>

      {notice && <Notice tone="good">{notice}</Notice>}
      <Blockers items={blockers} />

      {state.assessments.map((assessment: JobAssessment) => {
        const job = state.jobs.find(
          (j) => j.job_version_id === assessment.job_version_id,
        );
        const decision = state.decisions.find(
          (d) => d.task_id === assessment.task_id,
        );
        const draft = draftOf(assessment.task_id);
        const needsOverride =
          draft.decision !== "" &&
          ALIGNED[assessment.suggestion] !== draft.decision;

        return (
          <Panel
            key={assessment.assessment_id}
            title={job ? `${job.company_name} · ${job.title}` : assessment.job_version_id}
            subtitle={`Task ${assessment.task_id} · 岗位版本 ${assessment.job_version_id}`}
            aside={
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={SUGGESTION_TONE[assessment.suggestion]}>
                  Agent 建议：{AGENT_SUGGESTION_TEXT[assessment.suggestion]}
                </Badge>
                {decision && (
                  <Badge tone={DECISION_TONE[decision.decision]}>
                    真人：{HUMAN_DECISION_TEXT[decision.decision]}
                  </Badge>
                )}
              </div>
            }
          >
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <Stat
                  label="软匹配度"
                  value={`${assessment.soft_match_score.toFixed(1)}`}
                  hint="按权重加权，非平均分"
                />
                <Stat
                  label="置信度"
                  value={assessment.confidence.toFixed(2)}
                  hint="受证据覆盖与完整度影响"
                />
                <Stat
                  label="信息是否充分"
                  value={assessment.info_insufficient ? "不充分" : "充分"}
                  hint={
                    assessment.info_insufficient
                      ? "结论仅供参考，需补充证据"
                      : "关键能力项均有证据"
                  }
                />
                <Stat
                  label="结果来源"
                  value={SOURCE_LABEL_TEXT[assessment.source]}
                  hint="Agent 推断不等于真人结论"
                />
              </div>

              <Notice tone={SUGGESTION_TONE[assessment.suggestion]}>
                {assessment.suggestion_reason}
              </Notice>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">
                  硬性条件
                </p>
                <ul className="space-y-2">
                  {assessment.hard_requirements.map((check) => (
                    <li
                      key={check.criterion_id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <span className="min-w-0">
                        <span className="block break-words text-slate-900">
                          {check.criterion_name}
                        </span>
                        {check.note && (
                          <span className="mt-1 block break-words text-slate-600">
                            {check.note}
                          </span>
                        )}
                      </span>
                      <Badge tone={HARD_TONE[check.status]}>
                        {HARD_TEXT[check.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">
                  证据矩阵
                </p>
                <div className="-mx-4 overflow-x-auto sm:mx-0">
                  <table className="w-full min-w-[46rem] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs text-slate-500">
                        <th className="border-b border-slate-200 p-2">能力项</th>
                        <th className="border-b border-slate-200 p-2">权重</th>
                        <th className="border-b border-slate-200 p-2">匹配</th>
                        <th className="border-b border-slate-200 p-2">证据等级</th>
                        <th className="border-b border-slate-200 p-2">完整度</th>
                        <th className="border-b border-slate-200 p-2">缺口类型</th>
                        <th className="border-b border-slate-200 p-2">判断依据</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.criterion_assessments.map((row) => {
                        const criterion = job?.criteria.find(
                          (c) => c.criterion_id === row.criterion_id,
                        );
                        return (
                          <tr key={row.criterion_id} className="align-top">
                            <td className="border-b border-slate-100 p-2">
                              <span className="block font-medium break-words text-slate-900">
                                {row.criterion_name}
                              </span>
                              {criterion && (
                                <span className="mt-1 block text-xs text-slate-500">
                                  {
                                    CRITERION_TYPE_TEXT[
                                      criterion.type as CriterionType
                                    ]
                                  }
                                </span>
                              )}
                              {row.must_have && (
                                <span className="mt-1 inline-block text-xs text-rose-600">
                                  硬性条件
                                </span>
                              )}
                            </td>
                            <td className="border-b border-slate-100 p-2 text-slate-700">
                              {row.weight}%
                            </td>
                            <td className="border-b border-slate-100 p-2 text-slate-700">
                              {row.fit_score}
                            </td>
                            <td className="border-b border-slate-100 p-2 text-xs text-slate-600">
                              {EVIDENCE_LEVEL_TEXT[row.evidence_level]}
                            </td>
                            <td className="border-b border-slate-100 p-2 text-slate-700">
                              {row.completeness}%
                            </td>
                            <td className="border-b border-slate-100 p-2">
                              <Badge tone={GAP_TONE[row.gap_type]}>
                                {GAP_TEXT[row.gap_type]}
                              </Badge>
                            </td>
                            <td className="border-b border-slate-100 p-2">
                              <span className="block break-words text-slate-700">
                                {row.finding}
                              </span>
                              <span className="mt-1 block text-xs text-slate-500">
                                引用证据 {row.evidence_ids.length} 条 ·
                                {SOURCE_LABEL_TEXT[row.source]}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  「证据不足」表示材料里没有可核验的支撑，不代表候选人不具备该能力；
                  只有明确的反向证据才会标为「能力缺口」。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                  <p className="text-sm font-medium text-slate-900">优势</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-700">
                    {assessment.strengths.map((item) => (
                      <li key={item} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                  <p className="text-sm font-medium text-slate-900">证据缺口</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-700">
                    {assessment.evidence_gaps.map((item) => (
                      <li key={item} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3">
                  <p className="text-sm font-medium text-slate-900">建议动作</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-700">
                    {assessment.next_actions.map((item) => (
                      <li key={item} className="break-words">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {decision ? (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={DECISION_TONE[decision.decision]}>
                      {HUMAN_DECISION_TEXT[decision.decision]}
                    </Badge>
                    <Badge tone="neutral">
                      {SOURCE_LABEL_TEXT[decision.source]}
                    </Badge>
                    {decision.overrode_agent && (
                      <Badge tone="warn">已覆盖 Agent 建议</Badge>
                    )}
                  </div>
                  <Quote
                    text={decision.reason}
                    source={SOURCE_LABEL_TEXT[decision.source]}
                    meta={`${decision.decided_by} · ${decision.decided_at}`}
                  />
                  {decision.overrode_agent && decision.override_reason && (
                    <Quote
                      text={decision.override_reason}
                      source="覆盖理由"
                      meta={`Agent 建议为 ${AGENT_SUGGESTION_TEXT[assessment.suggestion]}`}
                    />
                  )}
                </div>
              ) : (
                <div className="decision-dock space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/30 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    真人确认（Agent 建议仅供参考）
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DECISIONS.map((option) => (
                      <Button
                        key={option}
                        variant={
                          draft.decision === option ? "primary" : "secondary"
                        }
                        onClick={() => patch(assessment.task_id, { decision: option })}
                      >
                        {HUMAN_DECISION_TEXT[option]}
                      </Button>
                    ))}
                  </div>
                  <label className="block">
                    <span className="text-xs text-slate-500">决策理由</span>
                    <textarea
                      value={draft.reason}
                      onChange={(event) =>
                        patch(assessment.task_id, { reason: event.target.value })
                      }
                      rows={3}
                      placeholder="写清依据了哪些证据，会作为可追溯反馈进入求职者的成长报告"
                      className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
                    />
                  </label>
                  {needsOverride && (
                    <label className="block">
                      <span className="text-xs text-rose-600">
                        与 Agent 建议不一致，必须填写覆盖理由
                      </span>
                      <textarea
                        value={draft.override_reason}
                        onChange={(event) =>
                          patch(assessment.task_id, {
                            override_reason: event.target.value,
                          })
                        }
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-rose-300 p-2 text-sm"
                      />
                    </label>
                  )}
                  <label className="block">
                    <span className="text-xs text-slate-500">确认人</span>
                    <input
                      value={draft.decided_by}
                      onChange={(event) =>
                        patch(assessment.task_id, {
                          decided_by: event.target.value,
                        })
                      }
                      className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 p-2 text-sm"
                    />
                  </label>
                  <Button
                    onClick={() => submit(assessment.task_id)}
                    busy={busy === assessment.task_id}
                    disabled={
                      draft.decision === "" ||
                      draft.reason.trim().length === 0 ||
                      (needsOverride && draft.override_reason.trim().length === 0)
                    }
                  >
                    记录真人决策
                  </Button>
                </div>
              )}
            </div>
          </Panel>
        );
      })}

      {state.decisions.length === state.assessments.length && (
        <Panel title="下一步">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/growth"
              className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              生成成长报告
            </Link>
            <span className="text-xs break-words text-slate-500">
              三个岗位都有结果后，成长 Agent 才会聚合反馈
            </span>
          </div>
        </Panel>
      )}
    </>
  );
}
