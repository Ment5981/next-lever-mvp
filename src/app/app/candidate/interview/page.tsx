import { MaterialsWorkbench } from "@/components/candidate/materials-workbench";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "模拟面试 · Next Level" };

export default function CandidateInterviewPage() {
  return <><WorkspaceHeader title="模拟面试" description="进入语音房间，和岗位 Agent 一问一答。" /><MaterialsWorkbench initial={workspaceSnapshot()} interviewOnly /></>;
}
