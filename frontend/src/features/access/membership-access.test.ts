import { describe, expect, it } from "vitest";
import type { AccessRole, TenantMembership } from "@/components/domain/access/types";
import { assignMembershipRole, toggleMembershipPermission } from "./membership-access";

const role: AccessRole = {
  id: "role-a",
  nameKey: "x",
  descriptionKey: "x",
  permissionKeys: ["patients.view_admin"],
  systemRole: true,
  active: true,
};

function membership(overrides: Partial<TenantMembership> = {}): TenantMembership {
  return {
    id: "membership-x",
    userId: "user-x",
    tenantId: "tenant-1",
    roleIds: ["role-a"],
    individualGrants: [],
    individualRestrictions: [],
    active: true,
    ...overrides,
  };
}

describe("membership-access", () => {
  it("assignMembershipRole replaces roleIds wholesale with exactly one role", () => {
    const updated = assignMembershipRole(membership({ roleIds: ["role-a"] }), "role-b");
    expect(updated.roleIds).toEqual(["role-b"]);
  });

  it("toggling a permission not granted by role or grant adds it as an individual grant", () => {
    const updated = toggleMembershipPermission(membership(), role, "invoices.view");
    expect(updated.individualGrants).toContain("invoices.view");
    expect(updated.individualRestrictions).not.toContain("invoices.view");
  });

  it("toggling a role-granted permission adds a restriction, never touches individualGrants", () => {
    const updated = toggleMembershipPermission(membership(), role, "patients.view_admin");
    expect(updated.individualRestrictions).toContain("patients.view_admin");
    expect(updated.individualGrants).toEqual([]);
  });

  it("toggling an individually-granted permission removes the grant (not a restriction)", () => {
    const withGrant = membership({ individualGrants: ["invoices.view"] });
    const updated = toggleMembershipPermission(withGrant, role, "invoices.view");
    expect(updated.individualGrants).not.toContain("invoices.view");
    expect(updated.individualRestrictions).toEqual([]);
  });

  it("toggling a restricted (role-granted) permission lifts the restriction, restoring the role default", () => {
    const restricted = membership({ individualRestrictions: ["patients.view_admin"] });
    const updated = toggleMembershipPermission(restricted, role, "patients.view_admin");
    expect(updated.individualRestrictions).not.toContain("patients.view_admin");
    expect(updated.individualGrants).toEqual([]);
  });

  it("the invariant holds: individualRestrictions only ever names a permission the role actually grants", () => {
    const restricted = membership({ individualRestrictions: ["patients.view_admin"] });
    expect(role.permissionKeys).toContain("patients.view_admin");
    // toggling a non-role permission never lands in individualRestrictions:
    const updated = toggleMembershipPermission(restricted, role, "caisse.manage");
    expect(updated.individualRestrictions).toEqual(["patients.view_admin"]);
    expect(updated.individualGrants).toEqual(["caisse.manage"]);
  });
});
