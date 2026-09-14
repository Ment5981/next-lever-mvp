import { WorkbenchHub } from "@/components/workbench-hub";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "招聘方工作台 · Next Level" };

export default function EmployerWorkbenchPage() {
  return <PageShell current="/employer/workbench" title="招聘方工作台" lead="在这里查看候选人 Agent、证据和真人决策。"><WorkbenchHub role="employer" initial={workspaceSnapshot()} /></PageShell>;
}
