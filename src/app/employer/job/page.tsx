import { JobBuilder } from "@/components/employer/job-builder";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "岗位创建 · Next Lever",
};

export default function EmployerJobPage() {
  return (
    <PageShell
      current="/employer/job"
      title="招聘方岗位创建"
      lead="用文字或语音把岗位讲一遍，AI 只问真正影响判断的几个问题，然后给出可编辑的能力模型。权重合计必须为 100%，确认后生成不可静默覆盖的岗位版本与招聘方 Agent。"
    >
      <JobBuilder initial={workspaceSnapshot()} />
    </PageShell>
  );
}
