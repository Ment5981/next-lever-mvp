import { CandidateAgentManagement } from "@/components/candidate/agent-management";
import { DemoFillButton } from "@/components/demo-fill-button";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职者管理 · Next Level" };

/** 求职者第三步：集中管理 Agent；深层材料与授权设置按需展开。 */
export default function CandidateManagePage() {
  const initial = workspaceSnapshot();
  return (
    <PageShell
      current="/candidate/manage"
      title="求职者管理"
      lead="需要调整材料、披露范围或 Agent 时，再来这里。"
      backHref="/candidate"
      backLabel="返回求职者空间"
      headerAside={<DemoFillButton />}
    >
      <CandidateAgentManagement initial={initial} />
    </PageShell>
  );
}
