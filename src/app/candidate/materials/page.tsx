import { MaterialsWorkbench } from "@/components/candidate/materials-workbench";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "材料与模拟面试 · Next Lever",
};

export default function CandidateMaterialsPage() {
  return (
    <PageShell
      current="/candidate/materials"
      title="求职者材料与模拟面试"
      lead="提交材料，确认事实，完成岗位模拟面试。"
    >
      <MaterialsWorkbench initial={workspaceSnapshot()} />
    </PageShell>
  );
}
