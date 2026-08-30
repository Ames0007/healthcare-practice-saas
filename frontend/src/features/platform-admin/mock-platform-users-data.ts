import type { PlatformUser, PlatformUserTenantMembership } from "@/components/domain/platform-admin/types";
import { getTenantMembershipsMockData, getUserAccountsMockData } from "@/features/access/mock-users-data";
import { addDaysIso } from "@/features/agenda/format";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { mapAccessUsersToPlatformUsers } from "./platform-users";
import { getTenantsMockData } from "./mock-tenants-data";

/**
 * `tenant-1`'s six other tenants get genuinely new user fixtures (no
 * existing "other cabinet" identity data anywhere covers them) — one owner
 * per tenant at minimum, two for `tenant-3` to prove
 * `buildPlatformUserRows` handles a multi-user tenant. Status coverage is
 * deliberate: `tenant-5`'s owner is `invited` (never logged in — the one
 * `UserAccountStatus` value no existing fixture anywhere else exercises),
 * `tenant-6`'s is `locked`, `tenant-7`'s is `disabled` — together with
 * `tenant-1`'s own real `active`/`disabled` mix (`mapAccessUsersToPlatformUsers`),
 * all four `UserAccountStatus` values appear at least once across the
 * platform directory.
 */
function getOtherTenantsPlatformUsers(): PlatformUser[] {
  return [
    { id: "user-6", displayName: "Hicham Fassi", email: "hicham.fassi@cabinet-atlas.test", status: "active", preferredLanguage: "fr", lastLoginAt: addDaysIso(MOCK_BUSINESS_DATE, -1) },
    { id: "user-7", displayName: "Salma Bennani", email: "salma.bennani@cabinet-sante-plus.test", status: "active", preferredLanguage: "fr", lastLoginAt: addDaysIso(MOCK_BUSINESS_DATE, -3) },
    { id: "user-8", displayName: "Reda Alami", email: "reda.alami@cabinet-sante-plus.test", status: "active", preferredLanguage: "ar", lastLoginAt: addDaysIso(MOCK_BUSINESS_DATE, -6) },
    { id: "user-9", displayName: "Karim Tazi", email: "karim.tazi@cabinet-ennasr.test", status: "active", preferredLanguage: "fr", lastLoginAt: addDaysIso(MOCK_BUSINESS_DATE, -20) },
    { id: "user-10", displayName: "Nadia Chraibi", email: "nadia.chraibi@cabinet-riad-kine.test", status: "invited", preferredLanguage: "fr" },
    { id: "user-11", displayName: "Omar Bensaid", email: "omar.bensaid@cabinet-zenith.test", status: "locked", preferredLanguage: "fr", lastLoginAt: addDaysIso(MOCK_BUSINESS_DATE, -45) },
    { id: "user-12", displayName: "Leila Amrani", email: "leila.amrani@cabinet-marrakech-multi.test", status: "disabled", preferredLanguage: "ar", lastLoginAt: addDaysIso(MOCK_BUSINESS_DATE, -90) },
  ];
}

function getOtherTenantsPlatformMemberships(): PlatformUserTenantMembership[] {
  return [
    { id: "pm-6", userId: "user-6", tenantId: "tenant-2", profileType: "owner_admin", isOwner: true, status: "active", joinedAt: "2026-08-09" },
    { id: "pm-7", userId: "user-7", tenantId: "tenant-3", profileType: "owner_admin", isOwner: true, status: "active", joinedAt: "2026-04-01" },
    { id: "pm-8", userId: "user-8", tenantId: "tenant-3", profileType: "practitioner", isOwner: false, status: "active", joinedAt: "2026-04-01" },
    { id: "pm-9", userId: "user-9", tenantId: "tenant-4", profileType: "owner_admin", isOwner: true, status: "active", joinedAt: "2025-08-23" },
    { id: "pm-10", userId: "user-10", tenantId: "tenant-5", profileType: "owner_admin", isOwner: true, status: "invited", joinedAt: "2025-11-23" },
    { id: "pm-11", userId: "user-11", tenantId: "tenant-6", profileType: "owner_admin", isOwner: true, status: "active", joinedAt: "2025-06-23" },
    { id: "pm-12", userId: "user-12", tenantId: "tenant-7", profileType: "owner_admin", isOwner: true, status: "disabled", joinedAt: "2025-09-01" },
  ];
}

/** `tenant-1`'s contribution is derived, never re-authored — see `mapAccessUsersToPlatformUsers`'s own doc comment. */
export function getPlatformUsersMockData(): PlatformUser[] {
  const tenantOne = getTenantsMockData()[0];
  const derived = mapAccessUsersToPlatformUsers(getUserAccountsMockData(), getTenantMembershipsMockData(), tenantOne);
  return [...derived.users, ...getOtherTenantsPlatformUsers()];
}

export function getPlatformMembershipsMockData(): PlatformUserTenantMembership[] {
  const tenantOne = getTenantsMockData()[0];
  const derived = mapAccessUsersToPlatformUsers(getUserAccountsMockData(), getTenantMembershipsMockData(), tenantOne);
  return [...derived.memberships, ...getOtherTenantsPlatformMemberships()];
}
