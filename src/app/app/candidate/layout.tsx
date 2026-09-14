import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { selectedWorkspaceRole } from "@/lib/server/role-session";

export const dynamic = "force-dynamic";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const role = await selectedWorkspaceRole();
  if (!role || role !== "candidate") redirect("/onboarding/role?role=candidate");
  return <WorkspaceShell role="candidate">{children}</WorkspaceShell>;
}
