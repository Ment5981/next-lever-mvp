import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { selectedWorkspaceRole } from "@/lib/server/role-session";

export const dynamic = "force-dynamic";

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const role = await selectedWorkspaceRole();
  if (!role || role !== "employer") redirect("/onboarding/role?role=employer");
  return <WorkspaceShell role="employer">{children}</WorkspaceShell>;
}
