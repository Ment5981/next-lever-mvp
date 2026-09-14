import { GrowthReportView } from "@/components/growth/report-view";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "成长报告 · Next Lever",
};

export default function GrowthPage() {
  return (
    <PageShell
      current="/growth"
      title="成长报告"
      lead="三个岗位都产出结果后，成长 Agent 才聚合反馈。报告区分跨岗位重复信号、岗位特有要求、材料证据问题和冲突反馈，并给出能产生新证据的成长任务与知乎官方知识资源。"
    >
      <GrowthReportView initial={workspaceSnapshot()} />
    </PageShell>
  );
}
