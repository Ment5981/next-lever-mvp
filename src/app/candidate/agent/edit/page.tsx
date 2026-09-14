import { CandidateAgentEditor } from "@/components/candidate/agent-editor";
import { DemoFillButton } from "@/components/demo-fill-button";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑求职者 Agent · Next Level" };

export default function CandidateAgentEditPage() {
  return (
    <PageShell current="/candidate/agent/edit" title="编辑求职者 Agent" lead="调整 Agent 的表达方式和工作边界。" backHref="/candidate/manage" backLabel="返回求职者管理" headerAside={<DemoFillButton />}>
      <CandidateAgentEditor initial={workspaceSnapshot()} />
    </PageShell>
  );
}
