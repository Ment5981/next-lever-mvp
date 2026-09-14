"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/button";
import { Badge, Blockers, Notice, Panel } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import type { CandidateAgent, CandidateAgentSettings } from "@/lib/schema/domain";

const TONES = [
  { value: "structured", label: "结构清晰", detail: "先结论，再给证据" },
  { value: "warm", label: "自然友好", detail: "保留真实语气" },
  { value: "concise", label: "简洁直接", detail: "减少无关铺陈" },
] as const;

/** 求职者 Agent 独立编辑页，不再复用材料创建流程。 */
export function CandidateAgentEditor({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const agent = state.candidate_agent;
  const fallbackPersonality: CandidateAgentSettings["personality"] = { tone: "structured", traits: ["基于事实", "具体回答", "谨慎披露"] };
  const personality = agent?.personality ?? fallbackPersonality;
  const [name, setName] = useState(agent?.agent_card_name ?? `${state.candidate.display_name} · 求职者 Agent`);
  const [tone, setTone] = useState<CandidateAgentSettings["personality"]["tone"]>(personality.tone);
  const [notice, setNotice] = useState("");
  const [blockers, setBlockers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setNotice("");
    const result = await callApi<{ candidate_agent: CandidateAgent }>("/api/candidate/agent/settings", {
      agent_card_name: name,
      personality: { tone, traits: ["基于事实", "具体回答", "谨慎披露"] },
      memory_policy: "confirmed_only",
    });
    if (result.ok) {
      setBlockers([]);
      setNotice("Agent 设置已保存。材料和披露范围仍由你单独确认。 ");
      await refresh();
    } else setBlockers(result.blockers);
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <Panel title="编辑求职者 Agent" subtitle="这里只调整 Agent 的工作方式，不修改你的原始材料。" aside={<Badge tone={agent ? "good" : "warn"}>{agent ? "可编辑" : "待生成"}</Badge>}>
        {!agent ? <Notice tone="warn">请先完成材料、模拟面试和披露确认，再生成求职者 Agent。</Notice> : <div className="space-y-5">
          <label className="block"><span className="text-sm font-medium text-slate-800">Agent 名称</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>
          <div><p className="text-sm font-medium text-slate-800">表达方式</p><div className="mt-2 grid gap-2 sm:grid-cols-3">{TONES.map((item) => <button key={item.value} type="button" onClick={() => setTone(item.value)} className={`rounded-xl border p-3 text-left transition ${tone === item.value ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 bg-white hover:border-indigo-300"}`}><span className="block text-sm font-medium text-slate-900">{item.label}</span><span className="mt-1 block text-xs text-slate-500">{item.detail}</span></button>)}</div></div>
          <div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-slate-900">记忆规则</p><Badge tone="good">仅确认内容</Badge></div><p className="mt-2 text-xs leading-5 text-slate-600">Agent 只读取你确认过的事实、作品和面试摘要；新内容不会自动写入。</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-medium text-slate-900">安全边界</p><div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">不推断敏感属性</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">不扩大披露</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">缺证据即说明不足</span></div></div>
          {notice && <Notice tone="good">{notice}</Notice>}<Blockers items={blockers} /><div className="flex flex-wrap gap-2"><Button onClick={save} busy={busy}>保存 Agent 设置</Button><Link href="/candidate/manage" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">返回管理</Link></div>
        </div>}
        {!agent && <div className="mt-4"><Link href="/candidate/materials" className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white">去建立 Agent</Link></div>}
      </Panel>
    </div>
  );
}
