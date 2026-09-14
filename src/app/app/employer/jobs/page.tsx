import { JobBuilder } from "@/components/employer/job-builder";
import { EmployerAgentManagement } from "@/components/employer/agent-management";
import { EmployerInbox } from "@/components/employer/inbox";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "我的智能体 · Next Level" };

export default function EmployerJobsPage() {
  const initial = workspaceSnapshot();
  return <><WorkspaceHeader title="我的智能体" description="管理岗位 Agent、记忆和招聘决策。" /><div className="space-y-6"><section id="publish-job"><JobBuilder initial={initial} /></section><EmployerAgentManagement initial={initial} /><details className="group rounded-3xl border border-slate-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden sm:px-6"><span><span className="block text-sm font-semibold text-slate-950">Agent 对话与招聘决策</span><span className="mt-1 block text-xs text-slate-500">展开查看候选人对话、证据和真人确认</span></span><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45">＋</span></summary><div className="border-t border-slate-100 p-4 sm:p-6"><EmployerInbox initial={initial} /></div></details></div></>;
}
