import { JobBuilder } from "@/components/employer/job-builder";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "岗位创建 · Next Level",
};

export default function EmployerJobPage() {
  return (
    <PageShell
      current="/employer/job"
      title="建立招聘 Agent"
      lead="补充公司背景和岗位信息，生成你的招聘 Agent。"
    >
      <JobBuilder initial={workspaceSnapshot()} />
    </PageShell>
  );
}
