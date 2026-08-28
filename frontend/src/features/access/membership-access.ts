import type { AccessRole, TenantMembership } from "@/components/domain/access/types";

/** This prototype's UI only ever assigns exactly one role per membership (task §13's own single-tenant, single-context scope) — the `roleIds` array shape stays real for a future multi-role case, this just always replaces it wholesale. */
export function assignMembershipRole(membership: TenantMembership, roleId: string): TenantMembership {
  return { ...membership, roleIds: [roleId] };
}

/**
 * One unified toggle per permission (UI-011X Gate 2 §12) rather than two
 * separate "grant" and "restrict" checkboxes — clicking a permission
 * that is *not* currently effective adds an individual grant (or lifts
 * an existing restriction, if that's why it wasn't effective);  clicking
 * one that *is* currently effective either removes the individual grant
 * that caused it, or — if the role itself is the source — adds a
 * restriction. This keeps an invariant `effective-access.test.ts` proves
 * directly: `individualRestrictions` only ever names a permission the
 * membership's own role actually grants; `individualGrants` only ever
 * names one the role does not.
 */
export function toggleMembershipPermission(membership: TenantMembership, role: AccessRole | undefined, permissionKey: string): TenantMembership {
  const roleGrants = role?.permissionKeys.includes(permissionKey) ?? false;
  const individuallyGranted = membership.individualGrants.includes(permissionKey);
  const restricted = membership.individualRestrictions.includes(permissionKey);
  const effectivelyGranted = (roleGrants || individuallyGranted) && !restricted;

  if (effectivelyGranted) {
    if (individuallyGranted) {
      return { ...membership, individualGrants: membership.individualGrants.filter((key) => key !== permissionKey) };
    }
    return { ...membership, individualRestrictions: [...membership.individualRestrictions, permissionKey] };
  }

  if (restricted) {
    return { ...membership, individualRestrictions: membership.individualRestrictions.filter((key) => key !== permissionKey) };
  }
  return { ...membership, individualGrants: [...membership.individualGrants, permissionKey] };
}
