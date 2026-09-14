import { AgentAuthorization } from "@/components/candidate/agent-authorization";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent 与授权 · Next Level",
};

export default function CandidateAgentPage() {
  return (
    <PageShell
      current="/candidate/agent"
      title="求职者 Agent 与岗位授权"
      lead="选择共享内容，确认授权，生成可投递 Agent。"
    >
      <AgentAuthorization initial={workspaceSnapshot()} />
    </PageShell>
  );
}
