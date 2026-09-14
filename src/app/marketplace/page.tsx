import { Marketplace } from "@/components/marketplace";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职广场 · Next Lever" };

export default function MarketplacePage() {
  return <PageShell current="/marketplace" title="求职广场" lead="浏览岗位 Agent，开始一场有证据的对话。"><Marketplace initial={workspaceSnapshot()} /></PageShell>;
}
