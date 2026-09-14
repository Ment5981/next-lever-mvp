import { WorkbenchHub } from "@/components/workbench-hub";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职者工作台 · Next Level" };

export default function CandidateWorkbenchPage() {
  return <PageShell current="/candidate/workbench" title="求职者工作台" lead="在这里查看材料、授权、A2A 和成长报告。"><WorkbenchHub role="candidate" initial={workspaceSnapshot()} /></PageShell>;
}
