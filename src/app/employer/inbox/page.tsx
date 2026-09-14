import { EmployerInbox } from "@/components/employer/inbox";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "招聘方工作台 · Next Lever",
};

export default function EmployerInboxPage() {
  return (
    <PageShell
      current="/employer/inbox"
      title="招聘方工作台"
      lead="按能力项查看证据矩阵：每一项都写明匹配度、证据等级、引用了几条证据以及缺口属于证据不足还是能力缺口。Agent 只给建议，邀约与否由真人确认，偏离建议时必须写明覆盖理由。"
    >
      <EmployerInbox initial={workspaceSnapshot()} />
    </PageShell>
  );
}
