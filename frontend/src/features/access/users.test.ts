import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getDelegationsMockData } from "./mock-delegations-data";
import { getTenantMembershipsMockData, getUserAccountsMockData } from "./mock-users-data";
import { buildUserRows, resolveAccessSummaryLabelKey } from "./users";

describe("users", () => {
  it("resolveAccessSummaryLabelKey always reads 'full' for Owner/Admin, regardless of grants/restrictions", () => {
    const roles = getAccessRolesMockData();
    const ownerRole = roles.find((role) => role.id === "role-owner-admin")!;
    const membership = getTenantMembershipsMockData().find((candidate) => candidate.id === "membership-1")!;
    expect(resolveAccessSummaryLabelKey(membership, ownerRole)).toBe("access.users.accessSummary.full");
  });

  it("resolveAccessSummaryLabelKey reads 'customized' once a grant or restriction exists", () => {
    const roles = getAccessRolesMockData();
    const receptionistRole = roles.find((role) => role.id === "role-receptionist")!;
    const meryem = getTenantMembershipsMockData().find((candidate) => candidate.id === "membership-3")!;
    expect(resolveAccessSummaryLabelKey(meryem, receptionistRole)).toBe("access.users.accessSummary.customized");
  });

  it("resolveAccessSummaryLabelKey falls back to the role's own name when there is no customization", () => {
    const roles = getAccessRolesMockData();
    const practitionerRole = roles.find((role) => role.id === "role-practitioner")!;
    const amal = getTenantMembershipsMockData().find((candidate) => candidate.id === "membership-2")!;
    expect(resolveAccessSummaryLabelKey(amal, practitionerRole)).toBe(practitionerRole.nameKey);
  });

  it("buildUserRows reproduces the task's own Meryem Bakkali figures exactly: role Réceptionniste, 2 grants, 1 restriction, 1 active delegation", () => {
    const rows = buildUserRows(
      getUserAccountsMockData(),
      getTenantMembershipsMockData(),
      getAccessRolesMockData(),
      MOCK_BUSINESS_DATE,
      getDelegationsMockData(),
    );
    const meryem = rows.find((row) => row.userId === "user-3")!;

    expect(meryem.role?.id).toBe("role-receptionist");
    expect(meryem.grantsCount).toBe(2);
    expect(meryem.restrictionsCount).toBe(1);
    expect(meryem.activeDelegationsCount).toBe(1);
    expect(meryem.accessSummaryLabelKey).toBe("access.users.accessSummary.customized");
  });

  it("buildUserRows defaults activeDelegationsCount to 0 when no delegations are passed", () => {
    const rows = buildUserRows(getUserAccountsMockData(), getTenantMembershipsMockData(), getAccessRolesMockData(), MOCK_BUSINESS_DATE);
    expect(rows.every((row) => row.activeDelegationsCount === 0)).toBe(true);
  });

  it("produces exactly one row per user with a real membership", () => {
    const rows = buildUserRows(getUserAccountsMockData(), getTenantMembershipsMockData(), getAccessRolesMockData(), MOCK_BUSINESS_DATE);
    expect(rows).toHaveLength(getUserAccountsMockData().length);
  });
});
