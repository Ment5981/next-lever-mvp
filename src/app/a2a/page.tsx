import { A2ATimeline } from "@/components/a2a/timeline";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "A2A 申请时间线 · Next Lever",
};

export default function A2APage() {
  return (
    <PageShell
      current="/a2a"
      title="A2A 申请时间线"
      lead="每个已授权岗位对应一条独立 Task。投递、追问、回答和评估结果都是可追溯的 Message 与 Artifact，状态由确定性状态机推进，自由文本改不了状态。"
    >
      <A2ATimeline initial={workspaceSnapshot()} />
    </PageShell>
  );
}
