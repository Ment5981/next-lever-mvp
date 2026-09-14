import { MaterialsWorkbench } from "@/components/candidate/materials-workbench";
import { PageShell } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "材料与模拟面试 · Next Lever",
};

export default function CandidateMaterialsPage() {
  return (
    <PageShell
      current="/candidate/materials"
      title="求职者材料与模拟面试"
      lead="粘贴简历、项目材料和作品链接，逐条核对提取出的事实与原文引用。模拟面试支持文字或语音回答，语音必须先看转写再确认，摘要也要你点头才会进入 Agent。"
    >
      <MaterialsWorkbench initial={workspaceSnapshot()} />
    </PageShell>
  );
}
