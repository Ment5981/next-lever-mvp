import { WorkspaceHeader } from "@/components/workspace-shell";
import { WorkspaceHome } from "@/components/workspace-home";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "招聘方空间 · Next Level" };

export default function EmployerWorkspacePage() {
  return <><WorkspaceHeader title="招聘方空间" description="让岗位先把真正的需求说清楚。" /><WorkspaceHome role="employer" initial={workspaceSnapshot()} /></>;
}

