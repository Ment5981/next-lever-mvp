import { A2ATimeline } from "@/components/a2a/timeline";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职记录 · Next Level" };

export default function CandidateApplicationsPage() {
  return <><WorkspaceHeader title="求职记录" description="只看对话进展和结果，需要时再打开详情。" /><A2ATimeline initial={workspaceSnapshot()} /></>;
}

