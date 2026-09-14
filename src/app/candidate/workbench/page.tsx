import { AgentAuthorization } from "@/components/candidate/agent-authorization";
import { PageShell } from "@/components/nav";
import { ProviderStatusStrip } from "@/components/provider-status";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职者工作台 · Next Level" };

export default function CandidateWorkbenchPage() {
  const initial = workspaceSnapshot();
  return (
    <PageShell
      current="/candidate/workbench"
      title="求职者工作台"
      lead="生成、发布和管理你的求职 Agent。"
    >
      <ProviderStatusStrip state={initial} />
      <AgentAuthorization initial={initial} />
    </PageShell>
  );
}
