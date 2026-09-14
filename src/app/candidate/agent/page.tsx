import { AgentAuthorization } from "@/components/candidate/agent-authorization";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent 与授权 · Next Lever",
};

export default function CandidateAgentPage() {
  return (
    <PageShell
      current="/candidate/agent"
      title="求职者 Agent 与岗位授权"
      lead="先逐项决定哪些事实、作品和面试摘要可以共享，确认后才会生成可投递的 Agent。授权时会明示岗位数量，未经这次授权，平台不会创建或发送任何申请。"
    >
      <AgentAuthorization initial={workspaceSnapshot()} />
    </PageShell>
  );
}
