import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getAccessRolesMockData } from "./mock-roles-data";
import { getDelegationsMockData } from "./mock-delegations-data";
import { getTenantMembershipsMockData } from "./mock-users-data";
import {
  buildDelegationFromFormValues,
  buildInitialDelegationFormValues,
  validateDelegationForm,
  type DelegationFormValues,
} from "./delegation-constraints";

const roles = getAccessRolesMockData();
const memberships = getTenantMembershipsMockData();
const owner = memberships.find((membership) => membership.id === "membership-1")!;
const receptionist = memberships.find((membership) => membership.id === "membership-3")!;

const messages = {
  required: "required",
  sameMember: "same",
  notDelegatable: "notDelegatable",
  delegatorLacksPermission: "lacks",
  endBeforeStart: "endBeforeStart",
};

function validValues(overrides: Partial<DelegationFormValues> = {}): DelegationFormValues {
  return {
    delegatorMembershipId: "membership-1",
    delegateMembershipId: "membership-2",
    permissionKey: "invoices.create",
    reason: "",
    startsAt: "2026-09-01",
    endsAt: "2026-09-10",
    ...overrides,
  };
}

describe("delegation-constraints", () => {
  it("buildInitialDelegationFormValues starts entirely empty", () => {
    expect(buildInitialDelegationFormValues()).toEqual({
      delegatorMembershipId: "",
      delegateMembershipId: "",
      permissionKey: "",
      reason: "",
      startsAt: "",
      endsAt: "",
    });
  });

  it("accepts a valid delegation where the delegator (Owner/Admin) really holds the permission", () => {
    expect(validateDelegationForm(validValues(), owner, roles, MOCK_BUSINESS_DATE, messages)).toEqual({});
  });

  it("rejects a non-delegatable permission outright, even if the delegator holds it", () => {
    const errors = validateDelegationForm(validValues({ permissionKey: "caisse.manage" }), owner, roles, MOCK_BUSINESS_DATE, messages);
    expect(errors.permissionKey).toBe("notDelegatable");
  });

  it("rejects delegating a permission the delegator does not currently hold", () => {
    const errors = validateDelegationForm(
      validValues({ delegatorMembershipId: "membership-3", permissionKey: "hr.manage" }),
      receptionist,
      roles,
      MOCK_BUSINESS_DATE,
      messages,
    );
    expect(errors.permissionKey).toBe("lacks");
  });

  it("rejects delegating to oneself", () => {
    const errors = validateDelegationForm(
      validValues({ delegateMembershipId: "membership-1" }),
      owner,
      roles,
      MOCK_BUSINESS_DATE,
      messages,
    );
    expect(errors.delegateMembershipId).toBe("same");
  });

  it("rejects an end date before the start date", () => {
    const errors = validateDelegationForm(
      validValues({ startsAt: "2026-09-10", endsAt: "2026-09-01" }),
      owner,
      roles,
      MOCK_BUSINESS_DATE,
      messages,
    );
    expect(errors.endsAt).toBe("endBeforeStart");
  });

  it("requires every field", () => {
    const errors = validateDelegationForm(buildInitialDelegationFormValues(), undefined, roles, MOCK_BUSINESS_DATE, messages);
    expect(errors.delegatorMembershipId).toBe("required");
    expect(errors.delegateMembershipId).toBe("required");
    expect(errors.permissionKey).toBe("required");
    expect(errors.startsAt).toBe("required");
    expect(errors.endsAt).toBe("required");
  });

  it("buildDelegationFromFormValues generates the next sequential id from existing delegations", () => {
    const created = buildDelegationFromFormValues(validValues(), getDelegationsMockData(), MOCK_BUSINESS_DATE);
    expect(created.id).toBe("delegation-5");
    expect(created.createdAt).toBe(MOCK_BUSINESS_DATE);
    expect(created.revokedAt).toBeUndefined();
  });

  it("buildDelegationFromFormValues trims a blank reason down to undefined", () => {
    const created = buildDelegationFromFormValues(validValues({ reason: "   " }), [], MOCK_BUSINESS_DATE);
    expect(created.reason).toBeUndefined();
  });
});
