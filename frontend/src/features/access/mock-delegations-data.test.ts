import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { PERMISSION_CATALOG } from "@/components/domain/access/permission-catalog";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getTenantMembershipsMockData } from "./mock-users-data";
import { getDelegationsMockData } from "./mock-delegations-data";
import { computeEffectivePermissions, hasEffectivePermission } from "./effective-access";
import { resolveDelegationStatus } from "./delegation-lifecycle";

describe("mock-delegations-data", () => {
  it("delegation ids are unique", () => {
    const delegations = getDelegationsMockData();
    expect(new Set(delegations.map((delegation) => delegation.id)).size).toBe(delegations.length);
  });

  it("every delegation's permissionKey is delegatable in the catalog", () => {
    const catalog = new Map(PERMISSION_CATALOG.map((permission) => [permission.key, permission]));
    for (const delegation of getDelegationsMockData()) {
      expect(catalog.get(delegation.permissionKey)?.delegatable).toBe(true);
    }
  });

  it("every delegation's delegator effectively holds the permission it delegates (a real, non-fabricated constraint)", () => {
    const memberships = getTenantMembershipsMockData();
    const roles = getAccessRolesMockData();
    for (const delegation of getDelegationsMockData()) {
      const delegator = memberships.find((membership) => membership.id === delegation.delegatorMembershipId)!;
      const effective = computeEffectivePermissions(delegator, roles, delegation.startsAt);
      expect(hasEffectivePermission(effective, delegation.permissionKey)).toBe(true);
    }
  });

  it("exactly one delegation is active as of the business date, and it is Meryem's — reproducing the task's own figure", () => {
    const active = getDelegationsMockData().filter(
      (delegation) => resolveDelegationStatus(delegation, MOCK_BUSINESS_DATE) === "active",
    );
    expect(active).toHaveLength(1);
    expect(active[0].delegateMembershipId).toBe("membership-3");
  });

  it("covers all 4 lifecycle states at least once (task §17)", () => {
    const statuses = new Set(getDelegationsMockData().map((delegation) => resolveDelegationStatus(delegation, MOCK_BUSINESS_DATE)));
    expect(statuses).toEqual(new Set(["scheduled", "active", "expired", "revoked"]));
  });
});
