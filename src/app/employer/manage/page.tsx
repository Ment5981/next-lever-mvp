import { DemoFillButton } from "@/components/demo-fill-button";
import { PageShell } from "@/components/nav";
import { EmployerAgentManagement } from "@/components/employer/agent-management";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "招聘方管理 · Next Level" };

/** 招聘方第三步：管理岗位 Agent、A2A 对话和候选人决策。 */
export default function EmployerManagePage() {
  return (
    <PageShell
      current="/employer/manage"
      title="招聘方管理"
      lead="管理岗位 Agent，查看 A2A 对话和候选人处理结果。"
      backHref="/employer"
      backLabel="返回招聘方空间"
      headerAside={<DemoFillButton />}
    >
      <EmployerAgentManagement initial={workspaceSnapshot()} />
    </PageShell>
  );
}
