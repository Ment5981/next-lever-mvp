import { GrowthCoach } from "@/components/growth/growth-coach";
import { DemoFillButton } from "@/components/demo-fill-button";
import { CandidateWorkspaceSidebar, PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "进阶路径 · Next Level" };

export default function GrowthCoachPage() {
  return (
    <PageShell
      current="/coach"
      title="进阶路径"
      lead="把岗位反馈变成下一步行动。"
      headerAside={<DemoFillButton />}
      sidebar={<CandidateWorkspaceSidebar current="/coach" />}
    >
      <GrowthCoach initial={workspaceSnapshot()} />
    </PageShell>
  );
}
