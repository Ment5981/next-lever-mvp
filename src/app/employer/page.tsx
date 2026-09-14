import { RoleHub } from "@/components/role-hub";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "招聘方空间 · Next Level" };

export default function EmployerPage() {
  return <PageShell current="/employer" title="招聘方空间" lead="创建招聘 Agent，发布岗位，等待合适的候选人。"><RoleHub role="employer" initial={workspaceSnapshot()} /></PageShell>;
}
