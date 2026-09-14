import { describe, expect, it } from "vitest";
import { parseWorkspaceRole } from "@/lib/auth/roles";
import { roleFromRequest } from "@/lib/server/role-session";

describe("workspace role boundary", () => {
  it("only accepts the two supported workspace roles", () => {
    expect(parseWorkspaceRole("candidate")).toBe("candidate");
    expect(parseWorkspaceRole("employer")).toBe("employer");
    expect(parseWorkspaceRole("admin")).toBeNull();
    expect(parseWorkspaceRole(undefined)).toBeNull();
  });

  it("reads the role from the server cookie instead of trusting a page label", () => {
    expect(roleFromRequest(new Request("http://localhost", { headers: { cookie: "next_lever_role=employer" } }))).toBe("employer");
    expect(roleFromRequest(new Request("http://localhost", { headers: { cookie: "next_lever_role=admin" } }))).toBeNull();
  });
});

