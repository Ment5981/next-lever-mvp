import { EmployerInbox } from "@/components/employer/inbox";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "招聘决策 · Next Level" };

export default function EmployerReviewsPage() {
  return <><WorkspaceHeader title="招聘决策" description="Agent 建议与真人确认分开保存。" /><EmployerInbox initial={workspaceSnapshot()} /></>;
}

