import { EmployerInbox } from "@/components/employer/inbox";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "候选人对话 · Next Level",
};

export default function EmployerInboxPage() {
  return (
    <PageShell
      current="/employer/inbox"
      title="候选人对话"
      lead="查看 Agent 建议，检查证据，完成真人决策。"
    >
      <EmployerInbox initial={workspaceSnapshot()} />
    </PageShell>
  );
}
