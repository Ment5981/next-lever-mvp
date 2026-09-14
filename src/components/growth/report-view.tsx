"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import {
  Badge,
  Blockers,
  Disclaimer,
  Notice,
  Panel,
  Quote,
  Stat,
  type Tone,
} from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState, ZhihuCounters } from "@/lib/client/types";
import type { GrowthReport, GrowthTask } from "@/lib/schema/domain";
import {
  FEEDBACK_CATEGORY_TEXT,
  SOURCE_LABEL_TEXT,
  ZHIHU_DATA_STATUS_TEXT,
  type FeedbackCategory,
  type SourceLabel,
  type ZhihuDataStatus,
} from "@/lib/schema/enums";

/** 四类反馈的顺序固定，方便用户对照 PRD 中的分类含义。 */
const CATEGORY_ORDER: FeedbackCategory[] = [
  "repeated_signal",
  "job_specific",
  "evidence_problem",
  "conflicting",
];

const CATEGORY_TONE: Record<FeedbackCategory, Tone> = {
  repeated_signal: "accent",
  job_specific: "info",
  evidence_problem: "warn",
  conflicting: "bad",
};

const CATEGORY_HINT: Record<FeedbackCategory, string> = {
  repeated_signal: "多个岗位都提到，优先处理",
  job_specific: "只对特定岗位成立，不要当成普遍结论",
  evidence_problem: "证据不足，不等于不具备该能力",
  conflicting: "岗位之间判断不一致，需要结合岗位语境看",
};

/** 知乎数据来源状态：只有 live 是实时返回，其余都必须让用户看出是缓存或演示。 */
const ZHIHU_TONE: Record<ZhihuDataStatus, Tone> = {
  live: "good",
  server_cache: "info",
  demo_cache: "demo",
  offline_fallback: "warn",
};

function orNotReturned(value: string | null) {
  return value && value.trim().length > 0 ? value : "未返回";
}

/**
 * 成长报告。
 *
 * 报告只在三个岗位都产出结果后生成，页面不做任何轮询：
 * 知乎官方能力仅在生成报告和用户点击刷新时调用一次。
 * 展示上刻意区分 Agent 推断与真人确认、以及四类反馈的不同性质，
 * 不对分数做简单平均，也不从少量样本推断整体就业市场。
 */
export function GrowthReportView({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshingTask, setRefreshingTask] = useState<string | null>(null);
  const [counters, setCounters] = useState<ZhihuCounters>(initial.zhihu_counters);

  const report: GrowthReport | null =
    state.reports.length > 0 ? state.reports[state.reports.length - 1] : null;

  const jobTitle = (jobVersionId: string) => {
    const job = state.jobs.find((j) => j.job_version_id === jobVersionId);
    return job ? `${job.company_name} · ${job.title}` : jobVersionId;
  };

  async function generate(forceRefresh: boolean) {
    setBusy(true);
    setNotice("");
    setBlockers([]);
    const result = await callApi<{
      report: GrowthReport;
      zhihu_counters: ZhihuCounters;
    }>("/api/growth/report", { force_refresh: forceRefresh });
    if (result.ok) {
      setCounters(result.data.zhihu_counters);
      setNotice(
        forceRefresh
          ? "已重新生成报告，并绕过服务端缓存重新请求知乎官方能力。"
          : "已生成成长报告。知乎资源只在这一步调用，切换页面不会重复请求。",
      );
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(false);
  }

  async function refreshZhihu(taskId: string) {
    setRefreshingTask(taskId);
    setNotice("");
    setBlockers([]);
    const result = await callApi<{
      meta: { data_status: ZhihuDataStatus; note: string };
      zhihu_counters: ZhihuCounters;
    }>("/api/zhihu/refresh", { task_id: taskId });
    if (result.ok) {
      setCounters(result.data.zhihu_counters);
      const status = ZHIHU_DATA_STATUS_TEXT[result.data.meta.data_status];
      setNotice(`已刷新该任务的知乎资源，当前数据来源：${status}。`);
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setRefreshingTask(null);
  }

  const decidedCount = state.decisions.length;
  const assessedCount = state.assessments.length;
  const ready = assessedCount >= 3 && decidedCount >= 3;

  return (
    <>
      <Panel
        title="生成报告"
        subtitle="报告要求三个岗位都已产出 Agent 评估并完成真人确认，避免用一两个样本下结论。"
        aside={
          <Badge tone={ready ? "good" : "warn"}>
            {ready ? "样本已齐" : "样本不足"}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="已产出评估" value={`${assessedCount} / 3`} />
            <Stat label="真人已确认" value={`${decidedCount} / 3`} />
            <Stat
              label="知乎今日调用"
              value={`${counters.app} / ${counters.daily_budget}`}
              hint={counters.breaker_open ? "熔断已打开" : "熔断未触发"}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => generate(false)} busy={busy} disabled={!ready}>
              {report ? "重新生成报告" : "生成成长报告"}
            </Button>
            {report && (
              <Button
                variant="secondary"
                onClick={() => generate(true)}
                busy={busy}
              >
                强制刷新知乎资源
              </Button>
            )}
            {!ready && (
              <Link
                href="/employer/inbox"
                className="text-sm text-indigo-700 underline"
              >
                先完成招聘方真人确认
              </Link>
            )}
          </div>

          {notice && <Notice tone="good">{notice}</Notice>}
          <Blockers items={blockers} title="暂时无法生成" />
        </div>
      </Panel>

      {!report ? (
        <Panel title="还没有报告">
          <Notice tone="neutral">
            走完主流程后回到这里生成报告。报告会区分跨岗位重复信号、岗位特有要求、材料证据问题和冲突反馈，并给出可产生新证据的成长任务。
          </Notice>
        </Panel>
      ) : (
        <>
          <Panel
            title="样本与置信度"
            subtitle="先看样本规模再看结论。分数不做简单平均，置信度由最低单项与均值共同决定，并随样本量缩放。"
            aside={<Badge tone="neutral">{report.report_id}</Badge>}
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Stat label="样本数" value={report.sample_size} hint="已授权岗位数" />
                <Stat
                  label="真人确认"
                  value={report.human_confirmed_count}
                  hint="招聘方本人决定"
                />
                <Stat
                  label="Agent 推断"
                  value={report.agent_inferred_count}
                  hint="仅为建议"
                />
                <Stat
                  label="信息不足"
                  value={report.info_insufficient_count}
                  hint="证据不够判断"
                />
                <Stat
                  label="整体置信度"
                  value={`${Math.round(report.overall_confidence * 100)}%`}
                  hint="样本越少越低"
                />
              </div>

              <Notice tone="neutral">{report.confidence_note}</Notice>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">反馈来源</p>
                <div className="flex flex-wrap gap-2">
                  {report.feedback_sources.map((source) => (
                    <Badge key={source} tone="neutral">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">
                  投递漏斗
                </p>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <Stat label="已授权" value={report.funnel.authorized} />
                  <Stat label="已发送" value={report.funnel.dispatched} />
                  <Stat label="已评估" value={report.funnel.assessed} />
                  <Stat label="真人已确认" value={report.funnel.human_confirmed} />
                  <Stat label="获得邀约" value={report.funnel.invited} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="四类反馈"
            subtitle="同一条反馈放在不同类别里含义完全不同，因此分类展示并附原始引用与来源标签。"
          >
            <div className="space-y-5">
              {CATEGORY_ORDER.map((category) => {
                const signals = report.signals.filter(
                  (signal) => signal.category === category,
                );
                return (
                  <div key={category}>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge tone={CATEGORY_TONE[category]}>
                        {FEEDBACK_CATEGORY_TEXT[category]}
                      </Badge>
                      <span className="text-xs break-words text-slate-500">
                        {CATEGORY_HINT[category]}
                      </span>
                    </div>
                    {signals.length === 0 ? (
                      <p className="text-sm text-slate-500">本次样本中没有这一类反馈。</p>
                    ) : (
                      <ul className="space-y-3">
                        {signals.map((signal) => (
                          <li
                            key={signal.signal_id}
                            className="rounded-xl border border-slate-200 p-3"
                          >
                            <p className="text-sm leading-relaxed break-words text-slate-900">
                              {signal.statement}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {signal.job_version_ids.map((jobVersionId) => (
                                <Badge key={jobVersionId} tone="neutral">
                                  {jobTitle(jobVersionId)}
                                </Badge>
                              ))}
                            </div>
                            <ul className="mt-2 space-y-2">
                              {signal.citations.map((citation, index) => (
                                <li key={`${signal.signal_id}-${index}`}>
                                  <Quote
                                    text={citation.quote}
                                    source={
                                      SOURCE_LABEL_TEXT[
                                        citation.source as SourceLabel
                                      ]
                                    }
                                    meta={jobTitle(citation.job_version_id)}
                                  />
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>

          {report.growth_tasks.map((task: GrowthTask, index: number) => (
            <Panel
              key={task.task_id}
              title={`成长任务 ${index + 1}：${task.target_capability}`}
              subtitle={task.reason}
              aside={
                <Badge tone={task.recommend_competition_or_oss ? "accent" : "neutral"}>
                  {task.recommend_competition_or_oss
                    ? "建议比赛或开源"
                    : "以真实实践为主"}
                </Badge>
              }
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {task.related_job_version_ids.map((jobVersionId) => (
                    <Badge key={jobVersionId} tone="info">
                      {jobTitle(jobVersionId)}
                    </Badge>
                  ))}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-slate-800">
                    原始反馈
                  </p>
                  <ul className="space-y-2">
                    {task.source_feedback.map((feedback, i) => (
                      <li key={`${task.task_id}-fb-${i}`}>
                        <Quote
                          text={feedback.quote}
                          source={SOURCE_LABEL_TEXT[feedback.source as SourceLabel]}
                          meta={jobTitle(feedback.job_version_id)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-800">
                      学习内容
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {task.learning_content.map((item, i) => (
                        <li key={`${task.task_id}-learn-${i}`} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-800">
                      验收标准
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {task.acceptance_criteria.map((item, i) => (
                        <li key={`${task.task_id}-ac-${i}`} className="break-words">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">实践任务</p>
                    <p className="mt-1 text-sm leading-relaxed break-words text-slate-800">
                      {task.practice_task}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">交付物</p>
                    <p className="mt-1 text-sm leading-relaxed break-words text-slate-800">
                      {task.deliverable}
                    </p>
                  </div>
                </div>

                {task.competition_or_oss_note && (
                  <Notice tone="accent">{task.competition_or_oss_note}</Notice>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Stat label="预计投入" value={task.estimated_effort} />
                  <Stat label="复评方式" value={task.re_evaluation} />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">
                      知乎官方能力返回的知识资源
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {task.zhihu_meta && (
                        <Badge tone={ZHIHU_TONE[task.zhihu_meta.data_status]}>
                          {ZHIHU_DATA_STATUS_TEXT[task.zhihu_meta.data_status]}
                        </Badge>
                      )}
                      <Button
                        variant="secondary"
                        busy={refreshingTask === task.task_id}
                        onClick={() => refreshZhihu(task.task_id)}
                      >
                        手动刷新
                      </Button>
                    </div>
                  </div>

                  {task.zhihu_meta && (
                    <p className="mb-2 text-xs leading-relaxed break-words text-slate-500">
                      接口 {task.zhihu_meta.api_name} · 获取时间{" "}
                      {task.zhihu_meta.fetched_at} · 今日调用{" "}
                      {task.zhihu_meta.calls_today} / {task.zhihu_meta.daily_budget}
                      {task.zhihu_meta.breaker_open ? " · 熔断已打开" : ""}
                      {task.zhihu_meta.note ? ` · ${task.zhihu_meta.note}` : ""}
                    </p>
                  )}

                  {task.zhihu_resources.length === 0 ? (
                    <Notice tone="warn">
                      本次没有取到知乎资源。上面的数据来源与获取时间已标明，不会用编造内容填充。
                    </Notice>
                  ) : (
                    <ul className="space-y-2">
                      {task.zhihu_resources.map((resource) => (
                        <li
                          key={resource.resource_id}
                          className="rounded-xl border border-slate-200 p-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="min-w-0 text-sm font-medium break-words text-slate-900">
                              {resource.url ? (
                                <a
                                  href={resource.url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="text-indigo-700 underline"
                                >
                                  {resource.title}
                                </a>
                              ) : (
                                resource.title
                              )}
                            </p>
                            <Badge tone={ZHIHU_TONE[resource.data_status]}>
                              {ZHIHU_DATA_STATUS_TEXT[resource.data_status]}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed break-words text-slate-700">
                            {orNotReturned(resource.excerpt)}
                          </p>
                          <dl className="mt-2 grid gap-x-4 gap-y-1 text-xs text-slate-500 sm:grid-cols-2">
                            <div className="flex gap-1 break-words">
                              <dt>作者</dt>
                              <dd>{orNotReturned(resource.author_name)}</dd>
                            </div>
                            <div className="flex gap-1 break-words">
                              <dt>来源类型</dt>
                              <dd>{orNotReturned(resource.content_type)}</dd>
                            </div>
                            <div className="flex gap-1 break-words">
                              <dt>权威度信号</dt>
                              <dd>{orNotReturned(resource.authority_signal)}</dd>
                            </div>
                            <div className="flex gap-1 break-words">
                              <dt>相关性信号</dt>
                              <dd>{orNotReturned(resource.relevance_signal)}</dd>
                            </div>
                            <div className="flex gap-1 break-words">
                              <dt>链接</dt>
                              <dd>{orNotReturned(resource.url)}</dd>
                            </div>
                            <div className="flex gap-1 break-words">
                              <dt>获取时间</dt>
                              <dd>{resource.fetched_at}</dd>
                            </div>
                          </dl>
                          <p className="mt-2 text-xs leading-relaxed break-words text-slate-600">
                            推荐原因：{resource.why_for_task}
                          </p>
                          <div className="mt-2">
                            <Badge tone="neutral">
                              来源：{SOURCE_LABEL_TEXT[resource.source as SourceLabel]}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </Panel>
          ))}

          <Disclaimer />
        </>
      )}
    </>
  );
}
