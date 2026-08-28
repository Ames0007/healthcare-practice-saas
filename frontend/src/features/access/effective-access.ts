import type { AccessRole, Delegation, EffectivePermissionEntry, PermissionSource, TenantMembership } from "@/components/domain/access/types";
import { PERMISSION_CATALOG } from "@/components/domain/access/permission-catalog";
import { resolveDelegationStatus } from "./delegation-lifecycle";

/** Union of every permission key granted by any role currently assigned to the membership. */
export function computeRoleGrantedPermissions(membership: TenantMembership, roles: AccessRole[]): Set<string> {
  const keys = new Set<string>();
  for (const role of roles) {
    if (!membership.roleIds.includes(role.id)) continue;
    for (const key of role.permissionKeys) keys.add(key);
  }
  return keys;
}

/**
 * The full effective-access resolution (UI-011X Gate 2 prerequisite,
 * extended by Gate 3 to fold in delegations, task §21). Precedence,
 * highest to lowest:
 *
 *   1. `individualRestrictions` — always wins, blocks every other source
 *      for that key, including an active delegation (task §41-equivalent
 *      "never let one layer silently contradict another" discipline —
 *      an owner's explicit restriction is never bypassable by a
 *      delegation on the same key, proven by
 *      `effective-access.test.ts`).
 *   2. Role permissions ∪ individual grants ∪ active delegations — any
 *      one of the three is sufficient to grant, and all three are
 *      recorded in `sources` when more than one applies.
 *
 * `delegations` defaults to `[]` so Gate 2's own callers (which predate
 * Gate 3) do not need to pass an empty array explicitly.
 */
export function computeEffectivePermissions(
  membership: TenantMembership,
  roles: AccessRole[],
  businessDate: string,
  delegations: Delegation[] = [],
): EffectivePermissionEntry[] {
  const roleKeys = computeRoleGrantedPermissions(membership, roles);
  const grantSet = new Set(membership.individualGrants);
  const restrictionSet = new Set(membership.individualRestrictions);
  const activeDelegationKeys = new Set(
    delegations
      .filter(
        (delegation) => delegation.delegateMembershipId === membership.id && resolveDelegationStatus(delegation, businessDate) === "active",
      )
      .map((delegation) => delegation.permissionKey),
  );

  return PERMISSION_CATALOG.map((permission) => {
    const sources: PermissionSource[] = [];
    if (roleKeys.has(permission.key)) sources.push("role");
    if (grantSet.has(permission.key)) sources.push("grant");
    if (activeDelegationKeys.has(permission.key)) sources.push("delegation");

    const restricted = restrictionSet.has(permission.key);

    return {
      permissionKey: permission.key,
      granted: sources.length > 0 && !restricted,
      sources,
      restricted,
    };
  });
}

export function hasEffectivePermission(entries: EffectivePermissionEntry[], permissionKey: string): boolean {
  return entries.find((entry) => entry.permissionKey === permissionKey)?.granted ?? false;
}

/** Only permissions actually granted — the compact list `users.ts`'s access-summary logic and `roles-page`-style consumers read. */
export function listGrantedPermissionKeys(entries: EffectivePermissionEntry[]): string[] {
  return entries.filter((entry) => entry.granted).map((entry) => entry.permissionKey);
}
