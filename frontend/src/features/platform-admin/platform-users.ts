import type { TenantMembership, UserAccount, UserAccountStatus } from "@/components/domain/access/types";
import type {
  PlatformAuditActionCode,
  PlatformMembershipProfileType,
  PlatformUser,
  PlatformUserRow,
  PlatformUserTenantMembership,
  Tenant,
} from "@/components/domain/platform-admin/types";

/** Spec #2 §29.1's 3 V1 system roles, mapped onto Spec #4 §4.2's `profile_type` ENUM — the same two vocabularies describing the same real people from two different modules' point of view. */
const ROLE_TO_PROFILE_TYPE: Record<string, PlatformMembershipProfileType> = {
  "role-owner-admin": "owner_admin",
  "role-practitioner": "practitioner",
  "role-receptionist": "staff",
};

/**
 * Derives `tenant-1`'s platform-wide rows from the REAL `access` module
 * fixtures (`UserAccount`/`TenantMembership`, UI-011X) rather than
 * re-authoring a parallel set of "platform" users for the one tenant that
 * already has real ones — the single most important "no duplicate
 * universe" seam in this module, proven by
 * `cross-platform-admin-integrity.test.ts`. `joinedAt` has no source field
 * on `TenantMembership` (Spec #4 §4.2 defines `joined_at`, but UI-011X's
 * narrower type omits it) — every mapped membership uses the tenant's own
 * `createdAt` as the one honest date available, documented rather than
 * invented per-user.
 */
export function mapAccessUsersToPlatformUsers(
  users: UserAccount[],
  memberships: TenantMembership[],
  tenant: Tenant,
): { users: PlatformUser[]; memberships: PlatformUserTenantMembership[] } {
  const platformUsers: PlatformUser[] = users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    status: user.status,
    preferredLanguage: "fr",
  }));

  const platformMemberships: PlatformUserTenantMembership[] = memberships.map((membership) => {
    const profileType = ROLE_TO_PROFILE_TYPE[membership.roleIds[0]] ?? "staff";
    return {
      id: `pm-${membership.id}`,
      userId: membership.userId,
      tenantId: tenant.id,
      profileType,
      isOwner: profileType === "owner_admin",
      status: membership.active ? "active" : "disabled",
      joinedAt: tenant.createdAt,
    };
  });

  return { users: platformUsers, memberships: platformMemberships };
}

/** One row per platform user, carrying every tenant relationship it holds (task Gate 4 §23) — never a second, per-tenant-duplicated user row. */
export function buildPlatformUserRows(
  users: PlatformUser[],
  memberships: PlatformUserTenantMembership[],
  tenants: Tenant[],
): PlatformUserRow[] {
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  return users.map((user) => {
    const userMemberships = memberships
      .filter((membership) => membership.userId === user.id)
      .map((membership) => ({
        tenantId: membership.tenantId,
        tenantName: tenantById.get(membership.tenantId)?.name ?? membership.tenantId,
        profileType: membership.profileType,
        isOwner: membership.isOwner,
        status: membership.status,
      }));

    return {
      userId: user.id,
      displayName: user.displayName,
      email: user.email,
      status: user.status,
      memberships: userMemberships,
    };
  });
}

/** Dashboard/Gate 4 KPI pair — total platform users and how many currently have `status === "active"`. */
export function computePlatformUserKpis(users: PlatformUser[]): { totalCount: number; activeCount: number } {
  return {
    totalCount: users.length,
    activeCount: users.filter((user) => user.status === "active").length,
  };
}

/** Gate 2/Gate 4 join helper — the owner-profile user's display name for one tenant, or `null` if none is modeled (never a placeholder string). */
export function findTenantOwnerName(
  tenantId: string,
  memberships: PlatformUserTenantMembership[],
  users: PlatformUser[],
): string | null {
  const ownerMembership = memberships.find((membership) => membership.tenantId === tenantId && membership.isOwner);
  if (!ownerMembership) return null;
  return users.find((user) => user.id === ownerMembership.userId)?.displayName ?? null;
}

/** Gate 2 tenant-directory "Users" column — count of memberships for one tenant, never a stored/duplicated field on `Tenant` itself. */
export function countTenantUsers(tenantId: string, memberships: PlatformUserTenantMembership[]): number {
  return memberships.filter((membership) => membership.tenantId === tenantId).length;
}

/**
 * Bounded platform user-status actions (Gate 4 §25). `invited` is left
 * untouched — inviting/re-inviting is account creation, not a status
 * action, and outside this task's bounded scope (task §1: no real
 * subscription/tenant/user mutation of any kind actually persists anyway).
 */
export type UserActionCode = Extract<PlatformAuditActionCode, "user.disabled" | "user.reactivated" | "user.unlocked">;

export function getAvailableUserActions(status: UserAccountStatus): UserActionCode[] {
  switch (status) {
    case "active":
      return ["user.disabled"];
    case "disabled":
      return ["user.reactivated"];
    case "locked":
      return ["user.unlocked"];
    case "invited":
    default:
      return [];
  }
}

export function applyUserAction(user: PlatformUser, action: UserActionCode): PlatformUser {
  switch (action) {
    case "user.disabled":
      return { ...user, status: "disabled" };
    case "user.reactivated":
    case "user.unlocked":
      return { ...user, status: "active" };
    default:
      return user;
  }
}
