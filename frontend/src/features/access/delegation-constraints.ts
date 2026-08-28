import type { AccessRole, Delegation, TenantMembership } from "@/components/domain/access/types";
import { getPermissionDefinition } from "@/components/domain/access/permission-catalog";
import { computeEffectivePermissions, hasEffectivePermission } from "./effective-access";

export interface DelegationFormValues {
  delegatorMembershipId: string;
  delegateMembershipId: string;
  permissionKey: string;
  reason: string;
  startsAt: string;
  endsAt: string;
}

export function buildInitialDelegationFormValues(): DelegationFormValues {
  return { delegatorMembershipId: "", delegateMembershipId: "", permissionKey: "", reason: "", startsAt: "", endsAt: "" };
}

/**
 * Delegation creation constraints (UI-011X Gate 3, task §19). Beyond
 * ordinary required-field/date-order validation, two rules are the
 * actual point of this module:
 *
 * 1. Only a `delegatable: true` permission may ever be delegated
 *    (`PermissionDefinition`'s own flag, Gate 1) — `caisse.manage`/
 *    `subscription.manage`/every `access.*` key are rejected outright.
 * 2. The delegator must *currently* effectively hold the permission
 *    (`computeEffectivePermissions`) — you cannot delegate authority you
 *    do not yourself have, mirroring `patient_access_grants`'s own
 *    "controlled sharing" framing (Spec #4 §7.3) rather than allowing an
 *    unbounded grant out of thin air.
 */
export function validateDelegationForm(
  values: DelegationFormValues,
  delegatorMembership: TenantMembership | undefined,
  roles: AccessRole[],
  businessDate: string,
  messages: {
    required: string;
    sameMember: string;
    notDelegatable: string;
    delegatorLacksPermission: string;
    endBeforeStart: string;
  },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.delegatorMembershipId) errors.delegatorMembershipId = messages.required;
  if (!values.delegateMembershipId) {
    errors.delegateMembershipId = messages.required;
  } else if (values.delegateMembershipId === values.delegatorMembershipId) {
    errors.delegateMembershipId = messages.sameMember;
  }

  if (!values.permissionKey) {
    errors.permissionKey = messages.required;
  } else {
    const permission = getPermissionDefinition(values.permissionKey);
    if (!permission?.delegatable) {
      errors.permissionKey = messages.notDelegatable;
    } else if (delegatorMembership) {
      const effective = computeEffectivePermissions(delegatorMembership, roles, businessDate);
      if (!hasEffectivePermission(effective, values.permissionKey)) {
        errors.permissionKey = messages.delegatorLacksPermission;
      }
    }
  }

  if (!values.startsAt) errors.startsAt = messages.required;
  if (!values.endsAt) {
    errors.endsAt = messages.required;
  } else if (values.startsAt && values.endsAt < values.startsAt) {
    errors.endsAt = messages.endBeforeStart;
  }

  return errors;
}

export function buildDelegationFromFormValues(values: DelegationFormValues, existing: Delegation[], businessDate: string): Delegation {
  const highest = existing.reduce((max, delegation) => {
    const match = /^delegation-(\d+)$/.exec(delegation.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return {
    id: `delegation-${highest + 1}`,
    delegatorMembershipId: values.delegatorMembershipId,
    delegateMembershipId: values.delegateMembershipId,
    permissionKey: values.permissionKey,
    reason: values.reason.trim() || undefined,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    createdAt: businessDate,
  };
}
