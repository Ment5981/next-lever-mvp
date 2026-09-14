"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { Badge, Blockers, Notice, Panel, Stat, type Tone } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { stateText } from "@/lib/a2a/protocol";
import {
  A2A_MESSAGE_TYPE_TEXT,
  APPLICATION_STATE_TEXT,
  type A2AMessageType,
  type ApplicationState,
} from "@/lib/schema/enums";
import type { A2ATaskRecord } from "@/lib/schema/domain";

const STATE_TONE: Record<string, Tone> = {
  TASK_STATE_SUBMITTED: "info",
  TASK_STATE_WORKING: "warn",
  TASK_STATE_INPUT_REQUIRED: "warn",
  TASK_STATE_COMPLETED: "good",
  TASK_STATE_FAILED: "bad",
  TASK_STATE_CANCELED: "neutral",
  TASK_STATE_REJECTED: "bad",
};

const MESSAGE_TONE: Record<A2AMessageType, Tone> = {
  application_submit: "info",
  clarification_request: "warn",
  clarification_response: "accent",
  assessment_result: "good",
  withdrawal_notice: "neutral",
  system_note: "neutral",
};

/**
 * A2A 申请时间线。
 *
 * 每个岗位一条独立 Task：状态历史、Message 信封、Artifact 都直接来自
 * 服务端记录，不是前端拼出来的展示文案。发送动作需要先完成授权，
 * 未授权时服务端门禁会拒绝并把原因显示在这里。
 */
export function A2ATimeline({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [openTask, setOpenTask] = useState<string | null>(null);

  const jobTitle = (jobVersionId: string) => {
    const job = state.jobs.find((j) => j.job_version_id === jobVersionId);
    return job ? `${job.company_name} · ${job.title}` : jobVersionId;
  };

  const taskIdForApplication = (applicationId: string) =>
    state.tasks.find((task) => task.application_id === applicationId)?.task_id ??
    null;

  async function dispatch() {
    setBusy(true);
    setNotice("");
    const result = await callApi<{ blockers: string[] }>("/api/a2a/dispatch", {});
    if (result.ok) {
      setBlockers(result.data.blockers ?? []);
      setNotice("已通过 A2A 发送申请，下面是每个岗位的独立 Task 时间线。");
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(false);
  }

  const authorized = state.authorizations.length > 0;
  const clarificationTotal = state.tasks.reduce(
    (sum, task) => sum + task.clarification_rounds,
    0,
  );

  return (
    <>
      <Panel
        title="发送申请"
        subtitle="申请只能由你的授权触发。发送后每个岗位各有一条 Task，全过程的消息与产物都可回看。"
        aside={
          <Badge tone={authorized ? "good" : "warn"}>
            {authorized ? "已获得用户授权" : "尚未授权"}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="传输层" value={state.a2a.transport} hint="可替换实现" />
            <Stat
              label="协议版本"
              value={state.a2a.protocol_version}
              hint="来自 A2A SDK"
            />
            <Stat label="Task 数量" value={state.tasks.length} hint="每岗位一条" />
            <Stat
              label="追问轮次合计"
              value={clarificationTotal}
              hint="每条 Task 最多 2 轮"
            />
          </div>

          <Notice tone="neutral">{state.a2a.compat_note}</Notice>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={dispatch} busy={busy} disabled={!authorized}>
              发送已授权的申请
            </Button>
            {!authorized && (
              <Link
                href="/candidate/agent"
                className="text-sm text-indigo-700 underline"
              >
                先去完成授权
              </Link>
            )}
          </div>

          {notice && <Notice tone="good">{notice}</Notice>}
          <Blockers items={blockers} title="部分岗位未完成" />
        </div>
      </Panel>

      <Panel
        title="申请状态"
        subtitle="申请状态由确定性状态机推进，自由文本不能直接改状态。"
      >
        {state.applications.length === 0 ? (
          <Notice tone="neutral">还没有申请。完成授权后这里才会出现记录。</Notice>
        ) : (
          <ul className="space-y-2">
            {state.applications.map((application) => (
              <li
                key={application.application_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm"
              >
                <span className="min-w-0 break-words text-slate-900">
                  {jobTitle(application.job_version_id)}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">
                    {
                      APPLICATION_STATE_TEXT[
                        application.state as ApplicationState
                      ]
                    }
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {taskIdForApplication(application.application_id) ??
                      "尚未生成 Task"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {state.tasks.map((task: A2ATaskRecord) => {
        const open = openTask === task.task_id;
        return (
          <Panel
            key={task.task_id}
            title={jobTitle(task.job_version_id)}
            subtitle={`Task ${task.task_id} · Context ${task.context_id} · ${task.transport} · 协议 ${task.protocol_version}`}
            aside={
              <Badge tone={STATE_TONE[task.state] ?? "neutral"}>
                {stateText(task.state)}
              </Badge>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="消息数" value={task.messages.length} />
                <Stat label="产物数" value={task.artifacts.length} />
                <Stat label="追问轮次" value={task.clarification_rounds} />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">
                  状态时间线
                </p>
                <ol className="space-y-2 border-l border-slate-200 pl-4">
                  {task.state_history.map((event, index) => (
                    <li key={`${event.at}-${index}`} className="text-sm">
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge tone={STATE_TONE[event.state] ?? "neutral"}>
                          {stateText(event.state)}
                        </Badge>
                        <span className="text-xs text-slate-500">{event.at}</span>
                      </span>
                      {event.note && (
                        <p className="mt-1 break-words text-slate-600">
                          {event.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-800">
                  A2A 消息
                </p>
                <ul className="space-y-2">
                  {task.messages.map((message) => (
                    <li
                      key={message.envelope.message_id}
                      className={`rounded-xl border p-3 text-sm ${
                        message.role === "agent"
                          ? "border-slate-200 bg-slate-50"
                          : "border-indigo-200 bg-indigo-50/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={MESSAGE_TONE[message.envelope.message_type]}>
                          {A2A_MESSAGE_TYPE_TEXT[message.envelope.message_type]}
                        </Badge>
                        <Badge tone="neutral">
                          {message.role === "agent"
                            ? "招聘方 Agent"
                            : "求职者 Agent"}
                        </Badge>
                        <span className="text-xs break-words text-slate-500">
                          {message.envelope.sender} → {message.envelope.receiver}
                        </span>
                      </div>
                      <p className="mt-2 leading-relaxed break-words whitespace-pre-wrap text-slate-800">
                        {message.text}
                      </p>
                      <p className="mt-2 text-xs break-words text-slate-500">
                        {message.envelope.timestamp} · 材料版本 v
                        {message.envelope.material_version} · 引用证据{" "}
                        {message.envelope.evidence_ids.length} 条
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    Artifact 产物
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => setOpenTask(open ? null : task.task_id)}
                  >
                    {open ? "收起原始载荷" : "查看原始载荷"}
                  </Button>
                </div>
                <ul className="space-y-2">
                  {task.artifacts.map((artifact) => (
                    <li
                      key={artifact.artifact_id}
                      className="rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <p className="font-medium break-words text-slate-900">
                        {artifact.name}
                      </p>
                      <p className="mt-1 break-words text-slate-600">
                        {artifact.description}
                      </p>
                      <p className="mt-1 text-xs break-words text-slate-500">
                        {artifact.artifact_id} · {artifact.created_at}
                      </p>
                      {open && (
                        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
                          {JSON.stringify(artifact.payload, null, 2)}
                        </pre>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        );
      })}

      {state.tasks.length > 0 && (
        <Panel title="下一步">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/employer/inbox"
              className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              前往招聘方工作台确认
            </Link>
            <span className="text-xs break-words text-slate-500">
              Agent 只给建议，邀约与否由招聘方真人确认
            </span>
          </div>
        </Panel>
      )}
    </>
  );
}
