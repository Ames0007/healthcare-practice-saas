import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { PERMISSION_CATALOG } from "@/components/domain/access/permission-catalog";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getTenantMembershipsMockData, getUserAccountsMockData } from "./mock-users-data";

describe("mock-users-data", () => {
  it("user account ids are unique", () => {
    const users = getUserAccountsMockData();
    expect(new Set(users.map((user) => user.id)).size).toBe(users.length);
  });

  it("every user's teamMemberId resolves to a real TeamMember (never a duplicate identity universe)", () => {
    const teamMemberIds = new Set(getTeamMembersMockData().map((member) => member.id));
    for (const user of getUserAccountsMockData()) {
      expect(user.teamMemberId).toBeDefined();
      expect(teamMemberIds.has(user.teamMemberId!)).toBe(true);
    }
  });

  it("not every TeamMember has a UserAccount — the module's own explicit rule", () => {
    const usersWithAccounts = new Set(getUserAccountsMockData().map((user) => user.teamMemberId));
    const allTeamMembers = getTeamMembersMockData();
    expect(allTeamMembers.some((member) => !usersWithAccounts.has(member.id))).toBe(true);
  });

  it("Othmane Zouiten's account is disabled, matching his own inactive TeamMember status (WF-65)", () => {
    const othmane = getUserAccountsMockData().find((user) => user.teamMemberId === "team-7")!;
    const teamMember = getTeamMembersMockData().find((member) => member.id === "team-7")!;
    expect(othmane.status).toBe("disabled");
    expect(teamMember.status).toBe("inactive");
  });

  it("every membership's userId resolves to a real user, and its roleIds to real roles", () => {
    const userIds = new Set(getUserAccountsMockData().map((user) => user.id));
    const roleIds = new Set(getAccessRolesMockData().map((role) => role.id));
    for (const membership of getTenantMembershipsMockData()) {
      expect(userIds.has(membership.userId)).toBe(true);
      expect(membership.roleIds.every((roleId) => roleIds.has(roleId))).toBe(true);
    }
  });

  it("every membership shares the same single synthetic tenant (no multi-tenant switching)", () => {
    const tenantIds = new Set(getTenantMembershipsMockData().map((membership) => membership.tenantId));
    expect(tenantIds.size).toBe(1);
  });

  it("Meryem Bakkali's membership reproduces the task's own worked example exactly: 2 grants, 1 restriction", () => {
    const meryem = getTenantMembershipsMockData().find((membership) => membership.id === "membership-3")!;
    expect(meryem.individualGrants).toHaveLength(2);
    expect(meryem.individualRestrictions).toHaveLength(1);
  });

  it("every individual grant/restriction key resolves to a real catalog permission", () => {
    const catalogKeys = new Set(PERMISSION_CATALOG.map((permission) => permission.key));
    for (const membership of getTenantMembershipsMockData()) {
      expect([...membership.individualGrants, ...membership.individualRestrictions].every((key) => catalogKeys.has(key))).toBe(true);
    }
  });
});
