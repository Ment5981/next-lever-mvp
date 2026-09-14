import { CandidateAgentManagement } from "@/components/candidate/agent-management";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { DemoFillButton } from "@/components/demo-fill-button";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "管理求职 Agent · Next Level" };

export default function CandidateAgentPage() {
  return <><WorkspaceHeader title="管理求职 Agent" description="公开什么、记住什么，由你决定。" action={<DemoFillButton />} /><CandidateAgentManagement initial={workspaceSnapshot()} /></>;
}

