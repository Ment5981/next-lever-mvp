import { DemoFillButton } from "@/components/demo-fill-button";
import { MarketplaceComposer } from "@/components/candidate/marketplace-composer";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";
export const metadata = { title: "发布求职 Agent · Next Level" };

export default function CandidatePublishPage() {
  return (
    <PageShell
      current="/candidate/publish"
      title="发布到求职广场"
      lead="编辑公开求职卡，确认后再发布。"
      headerAside={<DemoFillButton />}
    >
      <MarketplaceComposer initial={workspaceSnapshot()} />
    </PageShell>
  );
}
