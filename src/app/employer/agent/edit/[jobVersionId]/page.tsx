import { EmployerAgentEditor } from "@/components/employer/agent-editor";
import { DemoFillButton } from "@/components/demo-fill-button";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "编辑岗位 Agent · Next Level" };

export default async function EmployerAgentEditPage({ params }: { params: Promise<{ jobVersionId: string }> }) {
  const { jobVersionId } = await params;
  return (
    <PageShell current="/employer/manage" title="编辑岗位 Agent" lead="调整岗位表达，保存后生成新的岗位版本。" backHref="/employer/manage" backLabel="返回招聘方管理" headerAside={<DemoFillButton />}>
      <EmployerAgentEditor initial={workspaceSnapshot()} jobVersionId={jobVersionId} />
    </PageShell>
  );
}
