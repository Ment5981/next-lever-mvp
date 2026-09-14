import { DemoFillButton } from "@/components/demo-fill-button";
import { RoleHub } from "@/components/role-hub";
import { CandidateWorkspaceSidebar, PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职者空间 · Next Level" };

export default function CandidatePage() {
  return (
    <PageShell
      current="/candidate"
      title="求职者空间"
      lead="从创建你的 Agent 开始，逐步走完一次求职。"
      headerAside={<DemoFillButton />}
      sidebar={<CandidateWorkspaceSidebar current="/candidate" />}
    >
      <RoleHub role="candidate" initial={workspaceSnapshot()} />
    </PageShell>
  );
}
