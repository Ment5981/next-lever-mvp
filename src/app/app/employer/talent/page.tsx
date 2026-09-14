import { Marketplace } from "@/components/marketplace";
import { WorkspaceHeader } from "@/components/workspace-shell";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职广场 · Next Level" };

export default function EmployerTalentPage() {
  return <><WorkspaceHeader title="求职广场" description="查看岗位、求职者、活动和经验，找到下一次连接。" /><Marketplace initial={workspaceSnapshot()} mode="employer" /></>;
}
