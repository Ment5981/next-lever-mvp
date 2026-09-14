import { A2AConversation } from "@/components/a2a/conversation";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "A2A 对话 · Next Level" };

export default async function CandidateA2AChatPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const params = await searchParams;
  return <><WorkspaceHeader title="A2A 对话" description="让双方 Agent 先聊清楚，再决定下一步。" /><A2AConversation initial={workspaceSnapshot()} jobVersionId={params.job ?? ""} /></>;
}
