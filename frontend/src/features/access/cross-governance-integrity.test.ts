import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { PERMISSION_CATALOG } from "@/components/domain/access/permission-catalog";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getUserAccountsMockData, getTenantMembershipsMockData } from "./mock-users-data";
import { getDelegationsMockData } from "./mock-delegations-data";
import { getAccessAuditEventsMockData } from "./mock-audit-data";
import { computeEffectivePermissions } from "./effective-access";
import { resolveDelegationStatus } from "./delegation-lifecycle";
import { buildUserRows } from "./users";

/**
 * Proves the full chain the task's own §25/§55-equivalent demands:
 *
 *   Permission Catalog -> Role -> Membership -> Effective Access
 *   Delegation -> Membership -> Effective Access
 *   Audit -> Membership/Role/Delegation
 *
 * never disagrees with itself — mirrors `cross-subscription-integrity.
 * test.ts`/`cross-configuration-integrity.test.ts`'s own established
 * discipline. Piecemeal reconciliations already proven by each domain's
 * own fixture test (`mock-users-data.test.ts`, `mock-delegations-data.
 * test.ts`, `mock-audit-data.test.ts`) are not repeated here — this file
 * proves the END-TO-END chain across all four fixture sets at once.
 */
describe("Cross-governance integrity", () => {
  const catalogKeys = new Set(PERMISSION_CATALOG.map((permission) => permission.key));
  const roleIds = new Set(getAccessRolesMockData().map((role) => role.id));
  const membershipIds = new Set(getTenantMembershipsMockData().map((membership) => membership.id));

  it("every permission key referenced anywhere (roles, grants, restrictions, delegations) resolves to a real catalog entry", () => {
    for (const role of getAccessRolesMockData()) {
      expect(role.permissionKeys.every((key) => catalogKeys.has(key))).toBe(true);
    }
    for (const membership of getTenantMembershipsMockData()) {
      expect([...membership.individualGrants, ...membership.individualRestrictions].every((key) => catalogKeys.has(key))).toBe(true);
    }
    for (const delegation of getDelegationsMockData()) {
      expect(catalogKeys.has(delegation.permissionKey)).toBe(true);
    }
  });

  it("every role id referenced by a membership resolves to a real role", () => {
    for (const membership of getTenantMembershipsMockData()) {
      expect(membership.roleIds.every((roleId) => roleIds.has(roleId))).toBe(true);
    }
  });

  it("every membership id referenced by a delegation or audit event resolves to a real membership", () => {
    for (const delegation of getDelegationsMockData()) {
      expect(membershipIds.has(delegation.delegatorMembershipId)).toBe(true);
      expect(membershipIds.has(delegation.delegateMembershipId)).toBe(true);
    }
    for (const event of getAccessAuditEventsMockData()) {
      expect(membershipIds.has(event.actorMembershipId)).toBe(true);
      expect(membershipIds.has(event.targetMembershipId)).toBe(true);
    }
  });

  it("Meryem Bakkali's full effective-access set reconciles exactly: role default minus the restriction, plus both grants, plus the one active delegation", () => {
    const roles = getAccessRolesMockData();
    const meryem = getTenantMembershipsMockData().find((membership) => membership.id === "membership-3")!;
    const entries = computeEffectivePermissions(meryem, roles, MOCK_BUSINESS_DATE, getDelegationsMockData());
    const granted = entries.filter((entry) => entry.granted).map((entry) => entry.permissionKey).sort();

    // role-receptionist defaults: patients.view_admin, patients.edit_admin, appointments.manage
    // minus restriction: patients.edit_admin
    // plus grants: invoices.view, payments.record
    // plus active delegation: invoices.create
    expect(granted).toEqual(["appointments.manage", "invoices.create", "invoices.view", "patients.view_admin", "payments.record"].sort());
  });

  it("buildUserRows' own per-user counts (Gate 2's read model) reconcile with computeEffectivePermissions' own sources (Gate 4's resolver) for the same membership", () => {
    const roles = getAccessRolesMockData();
    const delegations = getDelegationsMockData();
    const rows = buildUserRows(getUserAccountsMockData(), getTenantMembershipsMockData(), roles, MOCK_BUSINESS_DATE, delegations);
    const meryemRow = rows.find((row) => row.userId === "user-3")!;
    const meryemMembership = getTenantMembershipsMockData().find((membership) => membership.id === "membership-3")!;
    const entries = computeEffectivePermissions(meryemMembership, roles, MOCK_BUSINESS_DATE, delegations);

    const grantedViaDelegationOnly = entries.filter((entry) => entry.granted && entry.sources.every((source) => source === "delegation"));
    expect(meryemRow.activeDelegationsCount).toBe(
      delegations.filter(
        (delegation) => delegation.delegateMembershipId === meryemMembership.id && resolveDelegationStatus(delegation, MOCK_BUSINESS_DATE) === "active",
      ).length,
    );
    expect(grantedViaDelegationOnly).toHaveLength(1);
  });

  it("no delegation anywhere targets a non-delegatable permission (the catalog's own flag is honored end to end, not just at form-validation time)", () => {
    const nonDelegatable = new Set(PERMISSION_CATALOG.filter((permission) => !permission.delegatable).map((permission) => permission.key));
    expect(getDelegationsMockData().every((delegation) => !nonDelegatable.has(delegation.permissionKey))).toBe(true);
  });

  it("no membership's individualRestrictions ever contains a permission its own role does not grant (the toggle invariant holds across the whole fixture set)", () => {
    const roles = getAccessRolesMockData();
    for (const membership of getTenantMembershipsMockData()) {
      const roleGranted = new Set(
        roles.filter((role) => membership.roleIds.includes(role.id)).flatMap((role) => role.permissionKeys),
      );
      expect(membership.individualRestrictions.every((key) => roleGranted.has(key))).toBe(true);
    }
  });
});
