import Link from "next/link";
import { MaterialsWorkbench } from "@/components/candidate/materials-workbench";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "简历与 Agent · Next Level" };

export default function CandidateResumePage() {
  return <><WorkspaceHeader title="简历与 Agent" description="确认材料，生成一个真正了解你的求职 Agent。" action={<Link href="/app/candidate/agent" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700">管理 Agent</Link>} /><MaterialsWorkbench initial={workspaceSnapshot()} /></>;
}

