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
      lead="聚合三个岗位的反馈，生成可执行成长任务。"
    >
      <GrowthReportView initial={workspaceSnapshot()} />
    </PageShell>
  );
}
