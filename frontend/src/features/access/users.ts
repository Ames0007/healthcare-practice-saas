import type { AccessRole, Delegation, TenantMembership, UserAccount } from "@/components/domain/access/types";
import { resolveDelegationStatus } from "./delegation-lifecycle";

/**
 * "Accès" summary (UI-011X Gate 2, Spec #9 Screen 46's own worked
 * example: "Complet"/"Personnalisé"/the role's own name — never a 4th
 * invented label). Owner/Admin always reads "Complet" regardless of any
 * grants/restrictions (it already holds every permission, ADR-011 would
 * be redundant to also call it "customized"); any other membership with
 * at least one individual grant or restriction reads "Personnalisé";
 * everything else falls back to its own role's display name (Screen
 * 46's own "Praticien" example — no customization, so the role name
 * itself is the honest summary).
 */
export function resolveAccessSummaryLabelKey(membership: TenantMembership, role: AccessRole | undefined): string {
  if (role?.id === "role-owner-admin") {
    return "access.users.accessSummary.full";
  }
  if (membership.individualGrants.length > 0 || membership.individualRestrictions.length > 0) {
    return "access.users.accessSummary.customized";
  }
  return role?.nameKey ?? "access.users.accessSummary.none";
}

export interface UserRow {
  userId: string;
  membershipId: string;
  displayName: string;
  email: string;
  status: UserAccount["status"];
  role: AccessRole | undefined;
  accessSummaryLabelKey: string;
  grantsCount: number;
  restrictionsCount: number;
  activeDelegationsCount: number;
}

/**
 * Joins User/Membership/Role/Delegation into one read-model row per user
 * (Spec #9 Screen 46, task §14) — reproduces the task's own Meryem
 * Bakkali wireframe figures exactly ("Permissions supplémentaires 2 /
 * Restrictions 1 / Délégations actives 1"), proven by
 * `cross-governance-integrity.test.ts` rather than merely asserted.
 * `delegations` defaults to `[]` so Gate 2's own callers (which predate
 * Gate 3) never need to pass one.
 */
export function buildUserRows(
  users: UserAccount[],
  memberships: TenantMembership[],
  roles: AccessRole[],
  businessDate: string,
  delegations: Delegation[] = [],
): UserRow[] {
  return users
    .map((user): UserRow | null => {
      const membership = memberships.find((candidate) => candidate.userId === user.id);
      if (!membership) return null;

      const role = roles.find((candidate) => membership.roleIds.includes(candidate.id));
      const activeDelegationsCount = delegations.filter(
        (delegation) => delegation.delegateMembershipId === membership.id && resolveDelegationStatus(delegation, businessDate) === "active",
      ).length;

      return {
        userId: user.id,
        membershipId: membership.id,
        displayName: user.displayName,
        email: user.email,
        status: user.status,
        role,
        accessSummaryLabelKey: resolveAccessSummaryLabelKey(membership, role),
        grantsCount: membership.individualGrants.length,
        restrictionsCount: membership.individualRestrictions.length,
        activeDelegationsCount,
      };
    })
    .filter((row): row is UserRow => row !== null);
}
