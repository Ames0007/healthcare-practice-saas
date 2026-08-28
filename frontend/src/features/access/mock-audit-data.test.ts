import { describe, expect, it } from "vitest";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getTenantMembershipsMockData, getUserAccountsMockData } from "./mock-users-data";
import { getDelegationsMockData } from "./mock-delegations-data";
import { getAccessAuditEventsMockData } from "./mock-audit-data";

describe("mock-audit-data", () => {
  it("event ids are unique", () => {
    const events = getAccessAuditEventsMockData();
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
  });

  it("every actor/target membership id resolves to a real membership", () => {
    const membershipIds = new Set(getTenantMembershipsMockData().map((membership) => membership.id));
    for (const event of getAccessAuditEventsMockData()) {
      expect(membershipIds.has(event.actorMembershipId)).toBe(true);
      expect(membershipIds.has(event.targetMembershipId)).toBe(true);
    }
  });

  it("Meryem's grant events name exactly the permission keys her real membership still carries — never a stale/invented log line", () => {
    const meryem = getTenantMembershipsMockData().find((membership) => membership.id === "membership-3")!;
    const grantEvents = getAccessAuditEventsMockData().filter(
      (event) => event.type === "permission_granted" && event.targetMembershipId === "membership-3",
    );
    expect(grantEvents.map((event) => event.detail).sort()).toEqual([...meryem.individualGrants].sort());
  });

  it("Meryem's restriction event names exactly the permission key her real membership still carries", () => {
    const meryem = getTenantMembershipsMockData().find((membership) => membership.id === "membership-3")!;
    const restrictionEvents = getAccessAuditEventsMockData().filter(
      (event) => event.type === "permission_restricted" && event.targetMembershipId === "membership-3",
    );
    expect(restrictionEvents.map((event) => event.detail)).toEqual(meryem.individualRestrictions);
  });

  it("role_assigned event's detail resolves to a real role id", () => {
    const roleIds = new Set(getAccessRolesMockData().map((role) => role.id));
    const event = getAccessAuditEventsMockData().find((candidate) => candidate.type === "role_assigned")!;
    expect(roleIds.has(event.detail!)).toBe(true);
  });

  it("delegation_created/delegation_revoked events reference real delegations, with matching dates", () => {
    const delegations = getDelegationsMockData();
    const createdEvent = getAccessAuditEventsMockData().find((event) => event.type === "delegation_created")!;
    const revokedEvent = getAccessAuditEventsMockData().find((event) => event.type === "delegation_revoked")!;

    const createdDelegation = delegations.find((delegation) => delegation.id === createdEvent.detail)!;
    expect(createdDelegation).toBeDefined();
    expect(createdDelegation.createdAt).toBe(createdEvent.occurredAt);

    const revokedDelegation = delegations.find((delegation) => delegation.id === revokedEvent.detail)!;
    expect(revokedDelegation).toBeDefined();
    expect(revokedDelegation.revokedAt).toBe(revokedEvent.occurredAt);
  });

  it("user_deactivated event's target is the one disabled UserAccount", () => {
    const disabledUser = getUserAccountsMockData().find((user) => user.status === "disabled")!;
    const disabledMembership = getTenantMembershipsMockData().find((membership) => membership.userId === disabledUser.id)!;
    const event = getAccessAuditEventsMockData().find((candidate) => candidate.type === "user_deactivated")!;
    expect(event.targetMembershipId).toBe(disabledMembership.id);
  });
});
