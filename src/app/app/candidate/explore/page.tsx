import { Marketplace } from "@/components/marketplace";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职广场 · Next Level" };

export default function CandidateExplorePage() {
  return <><WorkspaceHeader title="求职广场" description="岗位、求职者、活动和经验，都在这里开始连接。" /><Marketplace initial={workspaceSnapshot()} /></>;
}
