import { DemoFillButton } from "@/components/demo-fill-button";
import { RoleHub } from "@/components/role-hub";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "招聘方空间 · Next Level" };

export default function EmployerPage() {
  return <PageShell current="/employer" title="招聘方空间" lead="先生成岗位 Agent，再去广场等待合适的候选人。" headerAside={<DemoFillButton />}><RoleHub role="employer" initial={workspaceSnapshot()} /></PageShell>;
}
