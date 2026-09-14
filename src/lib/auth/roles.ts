import { z } from "zod";

export const roleSchema = z.enum(["candidate", "employer"]);
export type WorkspaceRole = z.infer<typeof roleSchema>;

export function parseWorkspaceRole(value: unknown): WorkspaceRole | null {
  const result = roleSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function roleLabel(role: WorkspaceRole) {
  return role === "candidate" ? "求职者" : "招聘方";
}

