import { RoleSelection } from "@/components/auth/role-selection";
import { parseWorkspaceRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";
export const metadata = { title: "选择身份 · Next Level" };

export default async function RolePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const params = await searchParams;
  const requestedNext = params.next?.startsWith("/app/") ? params.next : undefined;
  return <RoleSelection initialRole={parseWorkspaceRole(params.role) ?? "candidate"} nextPath={requestedNext} />;
}
