import { WorkspaceHeader } from "@/components/workspace-shell";
import { WorkspaceHome } from "@/components/workspace-home";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职者空间 · Next Level" };

export default function CandidateWorkspacePage() {
  return <><WorkspaceHeader title="求职者空间" description="从真实材料开始，找到下一步。" /><WorkspaceHome role="candidate" initial={workspaceSnapshot()} /></>;
}

