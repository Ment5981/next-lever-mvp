import { EmployerInbox } from "@/components/employer/inbox";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agent 对话 · Next Level" };

export default function EmployerConversationsPage() {
  return <><WorkspaceHeader title="Agent 对话" description="看看候选人和岗位 Agent 已经聊到了哪里。" /><EmployerInbox initial={workspaceSnapshot()} /></>;
}

