import { describe, expect, it } from "vitest";
import type { AccessRole, Delegation, TenantMembership } from "@/components/domain/access/types";
import { computeEffectivePermissions, hasEffectivePermission } from "./effective-access";

const roles: AccessRole[] = [
  {
    id: "role-a",
    nameKey: "x",
    descriptionKey: "x",
    permissionKeys: ["patients.view_admin", "appointments.manage"],
    systemRole: true,
    active: true,
  },
];

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

describe("effective-access", () => {
  it("grants a permission the role gives, with 'role' as its sole source", () => {
    const entries = computeEffectivePermissions(membership(), roles, "2026-08-23");
    const entry = entries.find((candidate) => candidate.permissionKey === "patients.view_admin")!;
    expect(entry.granted).toBe(true);
    expect(entry.sources).toEqual(["role"]);
  });

  it("does not grant a permission neither the role nor a grant provides", () => {
    const entries = computeEffectivePermissions(membership(), roles, "2026-08-23");
    expect(hasEffectivePermission(entries, "caisse.manage")).toBe(false);
  });

  it("grants a permission via an individual grant even without the role", () => {
    const entries = computeEffectivePermissions(membership({ individualGrants: ["invoices.view"] }), roles, "2026-08-23");
    const entry = entries.find((candidate) => candidate.permissionKey === "invoices.view")!;
    expect(entry.granted).toBe(true);
    expect(entry.sources).toEqual(["grant"]);
  });

  it("a restriction blocks a role-granted permission", () => {
    const entries = computeEffectivePermissions(
      membership({ individualRestrictions: ["patients.view_admin"] }),
      roles,
      "2026-08-23",
    );
    const entry = entries.find((candidate) => candidate.permissionKey === "patients.view_admin")!;
    expect(entry.granted).toBe(false);
    expect(entry.restricted).toBe(true);
    expect(entry.sources).toEqual(["role"]);
  });

  it("a restriction blocks an active delegation for the exact same key — restrictions always win", () => {
    const delegations: Delegation[] = [
      {
        id: "d1",
        delegatorMembershipId: "membership-owner",
        delegateMembershipId: "membership-x",
        permissionKey: "caisse.manage",
        startsAt: "2026-08-01",
        endsAt: "2026-08-31",
        createdAt: "2026-07-31",
      },
    ];
    const entries = computeEffectivePermissions(
      membership({ individualRestrictions: ["caisse.manage"] }),
      roles,
      "2026-08-23",
      delegations,
    );
    const entry = entries.find((candidate) => candidate.permissionKey === "caisse.manage")!;
    expect(entry.granted).toBe(false);
    expect(entry.restricted).toBe(true);
    expect(entry.sources).toEqual(["delegation"]);
  });

  it("an active delegation for this membership grants the permission", () => {
    const delegations: Delegation[] = [
      {
        id: "d1",
        delegatorMembershipId: "membership-owner",
        delegateMembershipId: "membership-x",
        permissionKey: "invoices.create",
        startsAt: "2026-08-01",
        endsAt: "2026-08-31",
        createdAt: "2026-07-31",
      },
    ];
    const entries = computeEffectivePermissions(membership(), roles, "2026-08-23", delegations);
    const entry = entries.find((candidate) => candidate.permissionKey === "invoices.create")!;
    expect(entry.granted).toBe(true);
    expect(entry.sources).toEqual(["delegation"]);
  });

  it("a scheduled (not-yet-started) delegation does not grant anything yet", () => {
    const delegations: Delegation[] = [
      {
        id: "d1",
        delegatorMembershipId: "membership-owner",
        delegateMembershipId: "membership-x",
        permissionKey: "invoices.create",
        startsAt: "2026-09-01",
        endsAt: "2026-09-15",
        createdAt: "2026-08-20",
      },
    ];
    const entries = computeEffectivePermissions(membership(), roles, "2026-08-23", delegations);
    expect(hasEffectivePermission(entries, "invoices.create")).toBe(false);
  });

  it("a delegation for a different membership never leaks into this one's effective set", () => {
    const delegations: Delegation[] = [
      {
        id: "d1",
        delegatorMembershipId: "membership-owner",
        delegateMembershipId: "membership-someone-else",
        permissionKey: "invoices.create",
        startsAt: "2026-08-01",
        endsAt: "2026-08-31",
        createdAt: "2026-07-31",
      },
    ];
    const entries = computeEffectivePermissions(membership(), roles, "2026-08-23", delegations);
    expect(hasEffectivePermission(entries, "invoices.create")).toBe(false);
  });

  it("every one of the 23 catalog permissions is represented, even ungranted ones", () => {
    const entries = computeEffectivePermissions(membership(), roles, "2026-08-23");
    expect(entries).toHaveLength(23);
  });
});
