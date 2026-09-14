"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Blockers } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import type { WorkspaceState } from "@/lib/client/types";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { ProviderCallMeta } from "@/lib/providers/types";
import type { FeedbackCategory } from "@/lib/schema/enums";

type CoachMessage = {
  role: "coach" | "user";
  text: string;
  meta?: ProviderCallMeta;
};

const COACH_PROMPTS = ["我这周先做什么？", "帮我找一场比赛", "怎样补足项目证据？"];

const CATEGORY_LABEL: Record<string, string> = {
  repeated_signal: "跨岗位重复信号",
  job_specific: "岗位特有要求",
  evidence_problem: "材料证据问题",
  conflicting: "冲突反馈",
};

function cleanText(value: string | null | undefined, limit = 180) {
  const compact = (value ?? "").replace(/[—–]/g, "-").replace(/\s+/g, " ").trim();
  return compact.length > limit ? `${compact.slice(0, limit)}…` : compact;
}

function sourceLabel(source: string) {
  if (source === "EmployerConfirmedFeedback") return "招聘方真人确认";
  if (source === "AgentInference") return "岗位 Agent 推断";
  if (source === "CandidateConfirmed") return "求职者已确认";
  return "反馈来源";
}

function resourceStatus(value: string) {
  return value.replace(/_/g, " ");
}

function taskTag(value: string) {
  if (value.includes("作品")) return "作品证据";
  if (value.includes("业务")) return "业务结果";
  if (value.includes("AI") || value.includes("模型")) return "AI 理解";
  return cleanText(value, 12);
}

export function GrowthCoach({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const latestReport = state.reports.at(-1);
  const [selectedGrowthTaskId, setSelectedGrowthTaskId] = useState(
    latestReport?.growth_tasks[0]?.task_id ?? null,
  );
  const [question, setQuestion] = useState("");
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);

  const growthTask =
    latestReport?.growth_tasks.find((task) => task.task_id === selectedGrowthTaskId) ??
    latestReport?.growth_tasks[0] ??
    null;
  const completedCount = state.tasks.filter(
    (task) => task.state === "TASK_STATE_COMPLETED",
  ).length;
  const repeatedSignals =
    latestReport?.signals.filter((signal) => signal.category === "repeated_signal")
      .length ?? 0;
  const feedbackCount = latestReport?.sample_size ?? state.tasks.length;

  useEffect(() => {
    if (!state.a2a_running) return;
    const timer = window.setInterval(() => void refresh(), 1500);
    return () => window.clearInterval(timer);
  }, [refresh, state.a2a_running]);

  async function refreshState() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function generateReport() {
    setGenerating(true);
    setBlockers([]);
    const result = await callApi("/api/growth/report", { force_refresh: false });
    if (result.ok) {
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setGenerating(false);
  }

  async function askCoach(nextPrompt?: string) {
    const nextQuestion = (nextPrompt ?? question).trim();
    if (!nextQuestion || busy) return;

    setBusy(true);
    setBlockers([]);
    setQuestion("");
    setCoachMessages((messages) => [
      ...messages,
      { role: "user", text: nextQuestion },
    ]);

    const context = [
      latestReport
        ? `当前有 ${latestReport.growth_tasks.length} 项成长任务，置信度 ${latestReport.overall_confidence}`
        : "当前还没有成长报告",
      growthTask
        ? `当前任务：${growthTask.target_capability}\n原因：${growthTask.reason}\n实践：${growthTask.practice_task}`
        : "当前没有选中的成长任务",
      state.assessments
        .map((item) => `${item.suggestion_reason}\n${item.evidence_gaps.join("；")}`)
        .join("\n"),
    ]
      .filter(Boolean)
      .join("\n");

    const result = await callApi<{ reply: string; provider: ProviderCallMeta }>(
      "/api/growth/chat",
      { question: nextQuestion, context },
    );

    if (result.ok) {
      setCoachMessages((messages) => [
        ...messages,
        {
          role: "coach",
          text: result.data.reply,
          meta: result.data.provider,
        },
      ]);
    } else {
      setBlockers(result.blockers);
    }
    setBusy(false);
  }

  const feedbackQuote = growthTask?.source_feedback[0];
  const resourceItems =
    growthTask?.zhihu_resources.filter((resource) => resource.url).slice(0, 2) ?? [];
  const evidenceChecklist =
    growthTask?.acceptance_criteria.slice(0, 3).map((item) => cleanText(item, 80)) ?? [
      "有真实问题场景和用户价值",
      "作品可以在线体验或本地运行",
      "能说明你的产品判断与技术实现",
    ];
  const actionItems = growthTask
    ? [
        {
          title: growthTask.recommend_competition_or_oss
            ? "参加一次相关比赛"
            : "完成一次真实实践",
          detail:
            growthTask.competition_or_oss_note ||
            "在真实约束中完成一次可验证的交付。",
          href: resourceItems[0]?.url ?? "/marketplace",
          label: resourceItems[0]?.url ? "看来源" : "去广场",
        },
        {
          title: "开源一个可体验 Demo",
          detail: growthTask.practice_task,
          href: "/candidate/manage#publish",
          label: "去发布",
        },
        {
          title: "用新证据重新申请",
          detail: growthTask.deliverable,
          href: "/marketplace",
          label: "去选择",
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(36,48,86,0.06)]">
        <div className="border-b border-slate-100 px-5 pb-6 pt-6 sm:px-8 sm:pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
                Next Level
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                你离目标岗位，还差哪一步？
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                从最近的岗位反馈里，找出最值得补上的一块。
              </p>
              {latestReport && <p className="mt-3 max-w-2xl rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">{latestReport.analysis_note}</p>}
            </div>
            <div className="flex flex-wrap items-end gap-4 sm:justify-end">
              <div className="text-left sm:text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {feedbackCount || 0} 个岗位 · {repeatedSignals} 个重复信号
                </p>
                <p className="mt-1 text-xs text-slate-400">基于已确认的投递反馈</p>
              </div>
              <Button onClick={() => void generateReport()} busy={generating} className="min-h-10 whitespace-nowrap">
                {latestReport ? "重新生成分析" : "生成差距分析"}
              </Button>
            </div>
          </div>

          {latestReport && latestReport.growth_tasks.length > 1 && (
            <div className="mt-6 flex gap-5 overflow-x-auto border-t border-slate-100 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {latestReport.growth_tasks.map((task) => {
                const active = task.task_id === growthTask?.task_id;
                return (
                  <button
                    key={task.task_id}
                    type="button"
                    onClick={() => setSelectedGrowthTaskId(task.task_id)}
                    aria-pressed={active}
                    className={`shrink-0 border-b-2 px-0.5 pb-2 text-sm font-medium transition ${
                      active
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {taskTag(task.target_capability)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {growthTask ? (
          <div className="px-5 pb-7 pt-7 sm:px-8 sm:pb-8">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)_2rem_minmax(0,1fr)]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-700">
                    1
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">共同差距</h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {feedbackCount} 个岗位反馈中的重复信号
                    </p>
                  </div>
                </div>
                <div className="mt-5 min-h-44 rounded-xl bg-slate-50 p-5">
                  <p className="text-base font-semibold leading-6 text-slate-950">
                    {cleanText(growthTask.target_capability, 72)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {cleanText(growthTask.reason, 150)}
                  </p>
                  {feedbackQuote && (
                    <blockquote className="mt-4 border-l-2 border-indigo-200 pl-3 text-xs italic leading-5 text-slate-500">
                      “{cleanText(feedbackQuote.quote, 118)}”
                      <footer className="mt-1 not-italic text-slate-400">
                        {sourceLabel(feedbackQuote.source)}
                      </footer>
                    </blockquote>
                  )}
                </div>
              </div>

              <div className="hidden items-center justify-center text-3xl font-light text-slate-300 md:flex">
                ›
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-700">
                    2
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">目标证据</h3>
                    <p className="mt-0.5 text-xs text-slate-400">用成果证明你已经做到</p>
                  </div>
                </div>
                <div className="mt-5 min-h-44 rounded-xl bg-indigo-50/60 p-5">
                  <p className="text-base font-semibold leading-6 text-slate-950">
                    {cleanText(growthTask.target_capability, 72)}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {evidenceChecklist.map((item) => (
                      <li key={item} className="flex gap-2 text-sm leading-5 text-slate-700">
                        <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs text-white">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="hidden items-center justify-center text-3xl font-light text-slate-300 md:flex">
                ›
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-indigo-50 text-lg font-semibold text-indigo-700">
                    3
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">下一步行动</h3>
                    <p className="mt-0.5 text-xs text-slate-400">从现在开始补齐证据</p>
                  </div>
                </div>
                <div className="mt-5 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                  {actionItems.map((item, index) => (
                    <div key={item.title} className="flex min-h-[5.85rem] gap-3 p-4">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {cleanText(item.detail, 90)}
                        </p>
                      </div>
                      <Link
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                        className="self-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold whitespace-nowrap text-white transition hover:bg-indigo-500"
                      >
                        {item.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-baseline gap-3">
                <h3 className="text-base font-semibold text-slate-950">推荐资源</h3>
                <p className="text-xs text-slate-400">打开链接，开始下一步</p>
              </div>
              {resourceItems.length > 0 ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {resourceItems.map((resource) => (
                    <a
                      key={resource.resource_id}
                      href={resource.url ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-xl border border-slate-200 px-4 py-3 transition hover:border-indigo-300 hover:bg-indigo-50/40"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
                          {cleanText(resource.title, 70)}
                        </p>
                        <span className="shrink-0 text-indigo-600">↗</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {cleanText(resource.excerpt || resource.why_for_task, 100)}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {resource.author_name || "知乎内容"} · {resourceStatus(resource.data_status)}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-400">
                  生成报告或手动刷新后，符合当前任务的知乎资源会显示在这里。
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 py-14 text-center sm:px-8">
            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              先完成几次岗位对话
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              当有足够的岗位反馈后，这里会留下最值得优先补上的能力证据。
            </p>
            <Link
              href="/marketplace"
              className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              去求职广场
            </Link>
          </div>
        )}
      </section>

      <details className="group rounded-xl border border-slate-200 bg-white px-5">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-sm [&::-webkit-details-marker]:hidden">
          <span className="font-semibold text-slate-900">岗位反馈</span>
          <span className="flex items-center gap-3 text-xs text-slate-400">
            {feedbackCount} 个岗位 · {repeatedSignals} 个重复信号
            <span className="text-base text-slate-500 transition group-open:rotate-45">＋</span>
          </span>
        </summary>
        <div className="grid gap-4 border-t border-slate-100 py-5 md:grid-cols-2">
          {(["repeated_signal", "job_specific", "evidence_problem", "conflicting"] as FeedbackCategory[]).map(
            (category) => {
              const signals =
                latestReport?.signals.filter((signal) => signal.category === category) ?? [];
              return (
                <div key={category} className="rounded-lg bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {CATEGORY_LABEL[category]}
                    </p>
                    <span className="text-xs text-slate-400">{signals.length}</span>
                  </div>
                  {signals.length > 0 ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {cleanText(signals[0].statement, 120)}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">暂无这类反馈</p>
                  )}
                </div>
              );
            },
          )}
          <div className="flex flex-wrap items-center gap-4 md:col-span-2">
            <Link href="/growth" className="text-sm font-medium text-indigo-700 hover:text-indigo-500">
              查看完整报告
            </Link>
            <button
              type="button"
              onClick={() => void refreshState()}
              disabled={refreshing}
              className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-50"
            >
              {refreshing ? "刷新中…" : "刷新状态"}
            </button>
          </div>
        </div>
      </details>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-lg text-indigo-600">
            ✦
          </span>
          <h2 className="shrink-0 text-base font-semibold text-slate-950">问进阶助手</h2>
          <p className="hidden text-xs text-slate-400 sm:block">把差距问清楚，再决定下一步</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {COACH_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void askCoach(prompt)}
              disabled={busy}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="growth-coach-question" className="sr-only">
            输入想问进阶助手的问题
          </label>
          <textarea
            id="growth-coach-question"
            rows={1}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void askCoach();
              }
            }}
            placeholder="例如：我这周先做什么？"
            className="min-h-11 min-w-0 flex-1 resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <Button
            onClick={() => void askCoach()}
            busy={busy}
            disabled={!question.trim()}
            className="min-h-11 shrink-0 bg-indigo-600 px-5 hover:bg-indigo-500 sm:self-stretch"
          >
            发送
          </Button>
        </div>

        {coachMessages.length > 0 && (
          <details className="mt-4 rounded-lg bg-slate-50 px-4 py-3" open={false}>
            <summary className="cursor-pointer list-none text-xs font-medium text-slate-500 [&::-webkit-details-marker]:hidden">
              查看最近对话（{coachMessages.length}）
            </summary>
            <div className="mt-3 space-y-3 border-t border-slate-200 pt-3" aria-live="polite">
              {coachMessages.slice(-4).map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.text.slice(0, 12)}`}
                  className={`text-sm leading-6 ${
                    message.role === "user"
                      ? "text-right text-slate-600"
                      : "border-l-2 border-indigo-300 pl-3 text-slate-800"
                  }`}
                >
                  {cleanText(message.text, 420)}
                  {message.meta && (
                    <span className="ml-2 text-[11px] text-slate-400">
                      {message.meta.mode === "live" ? "AI 实时" : "演示"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
        <Blockers items={blockers} />
      </section>

      <p className="text-center text-xs text-slate-400">
        已完成 {completedCount}/{state.tasks.length || 3} 次岗位对话
      </p>
    </div>
  );
}
