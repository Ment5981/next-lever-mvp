import { RoleHub } from "@/components/role-hub";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职者空间 · Next Lever" };

export default function CandidatePage() {
  return <PageShell current="/candidate" title="求职者空间" lead="构建你的 Agent，去求职广场开始对话。"><RoleHub role="candidate" initial={workspaceSnapshot()} /></PageShell>;
}
