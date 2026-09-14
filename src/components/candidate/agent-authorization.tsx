"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { Badge, Blockers, Disclaimer, Notice, Panel, Quote, Stat } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import { EVIDENCE_LEVEL_TEXT, SOURCE_LABEL_TEXT } from "@/lib/schema/enums";
import type {
  CandidateAgent,
  DisclosureScope,
  JobVersion,
} from "@/lib/schema/domain";

type AgentCard = {
  name: string;
  description: string;
  version: string;
  url: string;
  skills: { id: string; name: string; description: string }[];
};

/**
 * 求职者 Agent 与一次性批量授权。
 *
 * 两道门禁在界面上都能看见：披露范围逐项勾选并确认之后才能生成 Agent；
 * 授权时必须先逐项预览要共享的内容，并确认界面明示的岗位数量。
 * 未授权不会创建或发送任何申请，也不会静默新增岗位或扩大披露范围。
 */
export function AgentAuthorization({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);

  const [scope, setScope] = useState<DisclosureScope>(initial.disclosure);
  const [selected, setSelected] = useState<string[]>([]);
  const [countInput, setCountInput] = useState("");
  const [card, setCard] = useState<AgentCard | null>(null);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const candidate = state.candidate;
  const interview = state.interview;
  const agent: CandidateAgent | null = state.candidate_agent;
  const latestAuth = state.authorizations.at(-1) ?? null;

  const sharedEvidence = candidate.evidence.filter(
    (item) => item.confirmed && scope.evidence_ids.includes(item.evidence_id),
  );
  const sharedPortfolio = candidate.portfolio.filter((item) =>
    scope.portfolio_item_ids.includes(item.item_id),
  );
  const sharedTurns = interview.turns.filter(
    (turn) =>
      turn.summary_confirmed && scope.interview_turn_ids.includes(turn.turn_id),
  );

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
  }

  async function saveScope(confirmed: boolean) {
    setBusy(confirmed ? "confirm-scope" : "save-scope");
    setNotice("");
    const result = await callApi<unknown>("/api/candidate/disclosure", {
      scope,
      confirmed,
    });
    if (result.ok) {
      setBlockers([]);
      setNotice(
        confirmed
          ? "披露范围已确认。之后任何扩大范围的改动都需要你重新确认。"
          : "披露范围草稿已保存，还没有确认。",
      );
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  async function publishAgent() {
    setBusy("publish");
    setNotice("");
    const result = await callApi<{
      candidate_agent: CandidateAgent;
      agent_card: AgentCard;
    }>("/api/candidate/agent", {});
    if (result.ok) {
      setCard(result.data.agent_card);
      setBlockers([]);
      setNotice("可投递的求职者 Agent 已生成，下面可以选择意向岗位。");
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  async function submitAuthorization() {
    setBusy("authorize");
    setNotice("");
    const result = await callApi<{ note: string }>("/api/authorize", {
      job_version_ids: selected,
      acknowledged_job_count: Number(countInput),
    });
    if (result.ok) {
      setBlockers([]);
      setNotice(result.data.note);
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(null);
  }

  const countMatches = Number(countInput) === selected.length;

  return (
    <>
      <Panel
        title="第一步：逐项决定共享什么"
        subtitle="只有你确认过的事实和面试摘要才会出现在这里。勾选即代表允许共享给你稍后授权的岗位。"
        aside={
          <Badge tone={state.disclosure_confirmed ? "good" : "warn"}>
            {state.disclosure_confirmed ? "披露范围已确认" : "披露范围未确认"}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
              <input
                type="checkbox"
                checked={scope.share_display_name}
                onChange={(event) =>
                  setScope((prev) => ({
                    ...prev,
                    share_display_name: event.target.checked,
                  }))
                }
                className="mt-0.5 size-4"
              />
              <span>
                <span className="font-medium text-slate-900">共享称呼</span>
                <span className="mt-1 block text-slate-600">
                  {candidate.display_name}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm">
              <input
                type="checkbox"
                checked={scope.share_target_role}
                onChange={(event) =>
                  setScope((prev) => ({
                    ...prev,
                    share_target_role: event.target.checked,
                  }))
                }
                className="mt-0.5 size-4"
              />
              <span>
                <span className="font-medium text-slate-900">共享目标岗位</span>
                <span className="mt-1 block text-slate-600">
                  {candidate.target_role}
                </span>
              </span>
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              已确认的事实证据
            </p>
            {candidate.evidence.filter((e) => e.confirmed).length === 0 && (
              <Notice tone="warn">
                还没有已确认的事实。请先回到材料页确认，未确认内容不会进入 Agent。
              </Notice>
            )}
            {candidate.evidence
              .filter((item) => item.confirmed)
              .map((item) => (
                <label
                  key={item.evidence_id}
                  className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={scope.evidence_ids.includes(item.evidence_id)}
                    onChange={() =>
                      setScope((prev) => ({
                        ...prev,
                        evidence_ids: toggle(prev.evidence_ids, item.evidence_id),
                      }))
                    }
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-slate-900">
                      {item.claim}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">
                        {EVIDENCE_LEVEL_TEXT[item.level]}
                      </Badge>
                      <Badge tone="info">{SOURCE_LABEL_TEXT[item.source]}</Badge>
                      <span className="text-xs text-slate-500">
                        {item.material_ref}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
          </div>

          {candidate.portfolio.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">作品</p>
              {candidate.portfolio.map((item) => (
                <label
                  key={item.item_id}
                  className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={scope.portfolio_item_ids.includes(item.item_id)}
                    onChange={() =>
                      setScope((prev) => ({
                        ...prev,
                        portfolio_item_ids: toggle(
                          prev.portfolio_item_ids,
                          item.item_id,
                        ),
                      }))
                    }
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-slate-900">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-xs break-words text-slate-500">
                      {item.url ? item.url : "未提供可访问链接"}
                      {item.note ? ` · ${item.note}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">
              已确认的面试回答摘要
            </p>
            {interview.turns.filter((t) => t.summary_confirmed).length === 0 && (
              <Notice tone="warn">
                还没有确认过的面试摘要。摘要未确认不会共享给任何岗位。
              </Notice>
            )}
            {interview.turns
              .filter((turn) => turn.summary_confirmed)
              .map((turn) => (
                <label
                  key={turn.turn_id}
                  className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={scope.interview_turn_ids.includes(turn.turn_id)}
                    onChange={() =>
                      setScope((prev) => ({
                        ...prev,
                        interview_turn_ids: toggle(
                          prev.interview_turn_ids,
                          turn.turn_id,
                        ),
                      }))
                    }
                    className="mt-0.5 size-4 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs text-slate-500">
                      {turn.question}
                    </span>
                    <span className="mt-1 block break-words text-slate-900">
                      {turn.answer_summary}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      共享的是这段摘要，不是回答原文，也不含任何音频。
                    </span>
                  </span>
                </label>
              ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <Button
              onClick={() => void saveScope(true)}
              busy={busy === "confirm-scope"}
            >
              确认披露范围
            </Button>
            <Button
              variant="secondary"
              onClick={() => void saveScope(false)}
              busy={busy === "save-scope"}
            >
              仅保存草稿
            </Button>
          </div>
        </div>
      </Panel>

      <Panel
        title="第二步：生成可投递的求职者 Agent"
        subtitle="材料确认、模拟面试完成、披露范围确认三项齐全才能生成。Agent 只带着上面勾选的内容出去。"
        aside={
          <Badge tone={agent ? "good" : "warn"}>
            {agent ? "Agent 已生成" : "Agent 未生成"}
          </Badge>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="材料确认"
              value={candidate.materials_confirmed ? "已确认" : "未确认"}
              hint={`材料版本 v${state.material_version}`}
            />
            <Stat
              label="模拟面试"
              value={interview.completed ? "已完成" : "未完成"}
              hint={`${interview.turns.filter((t) => t.summary_confirmed).length} 条摘要已确认`}
            />
            <Stat
              label="共享内容"
              value={`${sharedEvidence.length + sharedPortfolio.length + sharedTurns.length} 项`}
              hint={`事实 ${sharedEvidence.length} · 作品 ${sharedPortfolio.length} · 摘要 ${sharedTurns.length}`}
            />
          </div>

          <Button onClick={publishAgent} busy={busy === "publish"}>
            生成求职者 Agent
          </Button>

          {agent && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium break-words text-slate-900">
                {agent.agent_card_name}
              </p>
              <p className="text-xs break-words text-slate-500">
                Agent ID {agent.candidate_agent_id} · 绑定材料版本 v
                {agent.material_version} · 生成于 {agent.created_at}
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                材料版本绑定在 Agent 上。之后修改材料会产生新版本，需要重新确认披露范围。
              </p>
            </div>
          )}

          {card && (
            <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
              <p className="text-sm font-medium text-slate-900">
                A2A Agent Card
              </p>
              <p className="text-xs break-words text-slate-600">
                {card.description}
              </p>
              <ul className="space-y-1 text-xs text-slate-600">
                {card.skills.map((skill) => (
                  <li key={skill.id} className="break-words">
                    <span className="font-medium">{skill.name}</span>：
                    {skill.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Panel>

      <Panel
        title="第三步：选择意向岗位并一次性授权"
        subtitle="平台不会替你新增岗位。下面每个岗位都写明了它进入候选列表的原因。"
        aside={
          <Badge tone={latestAuth ? "good" : "warn"}>
            {latestAuth ? `已授权 ${latestAuth.job_count} 个岗位` : "尚未授权"}
          </Badge>
        }
      >
        <div className="space-y-4">
          {state.jobs.map((job: JobVersion) => (
            <label
              key={job.job_version_id}
              className="flex items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm"
            >
              <input
                type="checkbox"
                checked={selected.includes(job.job_version_id)}
                onChange={() =>
                  setSelected((prev) => toggle(prev, job.job_version_id))
                }
                className="mt-0.5 size-4 shrink-0"
              />
              <span className="min-w-0">
                <span className="block font-medium break-words text-slate-900">
                  {job.company_name} · {job.title}
                </span>
                <span className="mt-1 block text-xs break-words text-slate-500">
                  岗位版本 {job.job_version_id} · v{job.version}
                </span>
                <span className="mt-2 block break-words text-slate-600">
                  进入候选的原因：
                  {state.job_match_reasons[job.job_version_id] ?? "未提供"}
                </span>
              </span>
            </label>
          ))}

          <Notice tone="warn">
            你即将把已勾选的{" "}
            <strong>
              {sharedEvidence.length + sharedPortfolio.length + sharedTurns.length}
            </strong>{" "}
            项内容授权给 <strong>{selected.length}</strong>{" "}
            个岗位。请在下面手动填入岗位数量以确认你看到的数字，数字不一致会被拒绝。
          </Notice>

          {selected.length > 0 && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-900">
                这些岗位将收到的内容
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-600">
                <li>
                  称呼：
                  {scope.share_display_name ? candidate.display_name : "不共享"}
                </li>
                <li>
                  目标岗位：
                  {scope.share_target_role ? candidate.target_role : "不共享"}
                </li>
                <li>事实证据 {sharedEvidence.length} 条</li>
                <li>作品 {sharedPortfolio.length} 项</li>
                <li>面试回答摘要 {sharedTurns.length} 条</li>
              </ul>
              {sharedEvidence.slice(0, 2).map((item) => (
                <Quote
                  key={item.evidence_id}
                  text={item.claim}
                  source={SOURCE_LABEL_TEXT[item.source]}
                  meta={`${EVIDENCE_LEVEL_TEXT[item.level]} · ${item.material_ref}`}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs text-slate-500">
                确认岗位数量（当前已选 {selected.length} 个）
              </span>
              <input
                value={countInput}
                onChange={(event) =>
                  setCountInput(event.target.value.replace(/[^0-9]/g, ""))
                }
                inputMode="numeric"
                placeholder="填入数字"
                className="mt-1 w-32 rounded-lg border border-slate-300 p-2 text-sm"
              />
            </label>
            <Button
              onClick={submitAuthorization}
              busy={busy === "authorize"}
              disabled={selected.length === 0 || !countMatches}
            >
              一次性授权并创建申请
            </Button>
          </div>

          {selected.length > 0 && countInput !== "" && !countMatches && (
            <Notice tone="bad">
              你填写的数量与已选岗位数量不一致，授权不会提交。
            </Notice>
          )}

          {notice && <Notice tone="good">{notice}</Notice>}
          <Blockers items={blockers} />

          {latestAuth && (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-sm">
              <p className="font-medium text-slate-900">授权记录</p>
              <p className="text-xs break-words text-slate-600">
                {latestAuth.authorization_id} · 授权 {latestAuth.job_count}{" "}
                个岗位 · {latestAuth.authorized_at}
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                披露范围已按授权时刻冻结为快照，后续 A2A
                沟通只能读取这份快照内的内容。
              </p>
              <p className="text-xs break-words text-slate-600">
                已创建申请 {state.applications.length} 条，尚未发送的申请不会离开平台。
              </p>
              <Link
                href="/a2a"
                className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                前往 A2A 时间线发送申请
              </Link>
            </div>
          )}
        </div>
      </Panel>

      <Disclaimer />
    </>
  );
}
