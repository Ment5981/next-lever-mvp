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
      lead="描述岗位，确认能力模型，生成岗位 Agent。"
    >
      <JobBuilder initial={workspaceSnapshot()} />
    </PageShell>
  );
}
