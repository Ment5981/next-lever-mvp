import Link from "next/link";
import { AgentAuthorization } from "@/components/candidate/agent-authorization";
import { Badge, Notice, Panel } from "@/components/ui";
import type { WorkspaceState } from "@/lib/client/types";

function ExpandButton({ children }: { children: React.ReactNode }) {
  return (
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 transition hover:border-indigo-300 hover:bg-indigo-50 [&::-webkit-details-marker]:hidden">
      <span>{children}</span>
      <span aria-hidden className="text-slate-400">＋</span>
    </summary>
  );
}

/** 求职者管理中心：默认只看状态，材料和授权等深层操作按需展开。 */
export function CandidateAgentManagement({ initial }: { initial: WorkspaceState }) {
  const candidate = initial.candidate;
  const agent = initial.candidate_agent;
  const post = initial.candidate_marketplace_posts.find(
    (item) => item.candidate_id === candidate.candidate_id,
  );
  const confirmedEvidence = candidate.evidence.filter((item) => item.confirmed);
  const confirmedTurns = initial.interview.turns.filter((item) => item.summary_confirmed);
  const latestAuthorization = initial.authorizations.at(-1);
  const memoryCount = confirmedEvidence.length + candidate.portfolio.length + confirmedTurns.length;

  return (
    <div className="space-y-5">
      <Panel
        title="我的 Agent"
        subtitle="管理它记住什么、如何表达，以及在哪里工作。"
        aside={<Badge tone={agent ? "good" : "warn"}>{agent ? "运行中" : "待建立"}</Badge>}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-lg font-semibold break-words text-slate-950">
              {agent?.agent_card_name ?? `${candidate.display_name} · 求职者 Agent`}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {agent ? `材料版本 v${agent.material_version} · ${candidate.target_role}` : "完成材料、面试和披露确认后生成"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/candidate/agent/edit" className="rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-indigo-500">编辑 Agent</Link>
            <Link href="/candidate/publish" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:border-indigo-300">{post ? "修改求职卡" : "发布求职卡"}</Link>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">记忆</p><p className="mt-1 text-lg font-semibold text-slate-950">{memoryCount}<span className="ml-1 text-xs font-normal text-slate-400">项</span></p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">对话</p><p className="mt-1 text-lg font-semibold text-slate-950">{initial.tasks.length}<span className="ml-1 text-xs font-normal text-slate-400">次</span></p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">授权岗位</p><p className="mt-1 text-lg font-semibold text-slate-950">{latestAuthorization?.job_count ?? 0}<span className="ml-1 text-xs font-normal text-slate-400">个</span></p></div>
          <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">求职卡</p><p className="mt-1 text-lg font-semibold text-slate-950">{post ? "已发布" : "未发布"}</p></div>
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2">
        <details className="group">
          <ExpandButton>记忆内容 <span className="ml-1 text-xs font-normal text-slate-400">{memoryCount} 项</span></ExpandButton>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs leading-5 text-slate-500">只保留你确认过的事实、作品和面试摘要。原始材料不会直接作为 Agent 记忆。</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge tone="good">事实 {confirmedEvidence.length}</Badge><Badge tone="neutral">作品 {candidate.portfolio.length}</Badge><Badge tone="accent">面试 {confirmedTurns.length}</Badge></div>
            {confirmedEvidence.length > 0 && <ul className="mt-3 space-y-2 text-sm text-slate-700">{confirmedEvidence.slice(0, 3).map((item) => <li key={item.evidence_id} className="line-clamp-2 rounded-lg bg-slate-50 p-2">{item.claim}</li>)}</ul>}
            {confirmedEvidence.length > 3 && <p className="mt-2 text-xs text-slate-400">还有 {confirmedEvidence.length - 3} 条，进入材料页查看全部。</p>}
            <Link href="/candidate/materials" className="mt-3 inline-block text-xs font-medium text-indigo-700">查看和修改记忆来源 →</Link>
          </div>
        </details>

        <details className="group">
          <ExpandButton>表达风格与边界</ExpandButton>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-700">具体回答</span><span className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-700">基于事实</span><span className="rounded-full bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-700">谨慎披露</span></div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-600"><li>只使用已确认内容回答岗位 Agent。</li><li>无法证明时回答“信息不足”，不把缺证据写成不会。</li><li>不根据口音、音色、语速、性别或年龄判断能力。</li></ul>
          </div>
        </details>

        <details className="group">
          <ExpandButton>披露与授权 <span className="ml-1 text-xs font-normal text-slate-400">{latestAuthorization ? `已授权 ${latestAuthorization.job_count} 个岗位` : "未授权"}</span></ExpandButton>
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs leading-5 text-slate-500">岗位、事实、作品和面试摘要由你逐项确认，一次授权后不会自动扩大范围。</p><Link href="#consent" className="mt-3 inline-block text-xs font-medium text-indigo-700">打开授权设置 →</Link></div>
        </details>

        <details className="group">
          <ExpandButton>沟通与成长</ExpandButton>
          <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4"><Link href="/coach" className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white">打开成长教练</Link><Link href="/a2a" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">查看 A2A 详情</Link><Link href="/growth" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">查看完整报告</Link></div>
        </details>
      </div>

      <details id="consent" className="group scroll-mt-24">
        <ExpandButton>高级设置：授权、生成与重新确认</ExpandButton>
        <div className="mt-3"><AgentAuthorization initial={initial} /></div>
      </details>

      {!agent && <Notice tone="neutral">还没有求职者 Agent。先完成材料和 AI 模拟面试，管理页会自动显示记忆与运行状态。</Notice>}
    </div>
  );
}
