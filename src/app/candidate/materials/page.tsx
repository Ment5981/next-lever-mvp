import { MaterialsWorkbench } from "@/components/candidate/materials-workbench";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "建立我的 Agent · Next Level",
};

export default function CandidateMaterialsPage() {
  return (
    <PageShell
      current="/candidate/materials"
      title="建立我的 Agent"
      lead="上传材料，完成一次 AI 模拟面试。"
    >
      <MaterialsWorkbench initial={workspaceSnapshot()} />
    </PageShell>
  );
}
