import { GrowthCoach } from "@/components/growth/growth-coach";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { DemoFillButton } from "@/components/demo-fill-button";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "进阶路径 · Next Level" };

export default function CandidatePathPage() {
  return <><WorkspaceHeader title="进阶路径" description="看清差距，安排下一次真实实践。" action={<DemoFillButton />} /><GrowthCoach initial={workspaceSnapshot()} /></>;
}

