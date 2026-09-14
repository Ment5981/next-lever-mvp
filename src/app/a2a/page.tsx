import { A2ATimeline } from "@/components/a2a/timeline";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "A2A 申请时间线 · Next Level",
};

export default function A2APage() {
  return (
    <PageShell
      current="/a2a"
      title="A2A 申请时间线"
      lead="查看三个岗位 Agent 的投递、追问、评估与状态。"
    >
      <A2ATimeline initial={workspaceSnapshot()} />
    </PageShell>
  );
}
