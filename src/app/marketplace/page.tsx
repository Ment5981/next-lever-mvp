import { Marketplace } from "@/components/marketplace";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职广场 · Next Level" };

export default function MarketplacePage() {
  return <PageShell current="/marketplace" title="求职广场" lead="岗位、求职者 Agent 和能补齐能力的成长活动都在这里。"><Marketplace initial={workspaceSnapshot()} /></PageShell>;
}
