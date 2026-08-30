import type { CabinetSpecialty, PreferredLanguage } from "@/components/domain/settings/types";
import type { UserAccountStatus } from "@/components/domain/access/types";
import type { PlanCode, Subscription, SubscriptionStatus } from "@/components/domain/subscription/types";

/**
 * SaaS Platform Admin domain (UI-013ABCDE, Spec #4 §5.1/§55, Spec #2 §55,
 * doc 09 Screens 54-58). Frontend-prototype read models only — the future
 * Laravel backend is the sole authority (mirrors `domain/subscription/`'s
 * own "frontend UX only" framing, task §6: "Frontend Admin UI ≠ Platform
 * authorization"). No `platform_admin_users`/`platform_admin_roles`
 * (Spec #4 §55) are modeled here — that table names the SaaS operator's own
 * login identity, which task §6 explicitly defers ("Future authentication/
 * authorization must protect `/admin/*`"); everything below instead models
 * the tenants/subscriptions/users the platform operator *observes and acts
 * on*, not who is allowed to observe them.
 */

/** Spec #4 §5.1 `tenants.status` ENUM, verbatim — distinct from `SubscriptionStatus` (never inferred from it, Spec #4 §57.7). */
export type TenantStatus = "active" | "suspended" | "closed";

/**
 * Spec #4 §5.1 `tenants`, narrowed to directory/360°-relevant fields (no
 * `logo_file_id`/`currency_code`/`timezone` — this is a platform-wide
 * projection, not the tenant's own Settings record; `CabinetProfile`
 * already owns those for the single prototype tenant). `id: "tenant-1"`
 * for the one real cabinet this whole prototype is built around — every
 * other row is a genuinely separate fixture tenant (task §5/§77-equivalent
 * "no second fixture universe", applied here as "no second *tenant-1*").
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  specialty: CabinetSpecialty;
  city?: string;
  status: TenantStatus;
  createdAt: string;
}

/** Spec #4 §4.2 `tenant_memberships.profile_type` ENUM, verbatim. */
export type PlatformMembershipProfileType = "owner_admin" | "practitioner" | "staff";

/** Spec #4 §4.2 `tenant_memberships.status` ENUM, verbatim — distinct from `UserAccountStatus` (a user account can be active while one specific membership is disabled, or vice versa). */
export type PlatformMembershipStatus = "invited" | "active" | "disabled";

/**
 * Spec #4 §4.2 `tenant_memberships`, genuinely spanning multiple tenants —
 * unlike `domain/access/TenantMembership` (UI-011X), which the task's own
 * doc comment narrows to "this prototype's single synthetic tenant." This
 * type is the platform-wide counterpart the Super Admin needs to answer
 * "which tenants does this user belong to" (task Gate 4 §23).
 */
export interface PlatformUserTenantMembership {
  id: string;
  userId: string;
  tenantId: string;
  profileType: PlatformMembershipProfileType;
  isOwner: boolean;
  status: PlatformMembershipStatus;
  joinedAt: string;
}

/**
 * Spec #4 §4.1 `users`, narrowed like `domain/access/UserAccount` (no
 * `password_hash`, no MFA/session fields). `status` reuses
 * `UserAccountStatus` outright — both trace to the identical Spec #4 §4.1
 * `users.status` ENUM, so redefining it here would be the same vocabulary
 * under a second name (never a duplicate universe).
 */
export interface PlatformUser {
  id: string;
  displayName: string;
  email: string;
  status: UserAccountStatus;
  preferredLanguage: PreferredLanguage;
  lastLoginAt?: string;
}

/**
 * Bounded action log (Spec #4 §30.1 `audit_events`, narrowed to the fields
 * a prototype list can honestly populate — no `before_data`/`after_data`/
 * `ip_metadata`). Action vocabulary is bounded to exactly the actions this
 * task implements (Gate 2 tenant status, Gate 3 subscription status, Gate 4
 * user status) — never a speculative larger catalog.
 */
export type PlatformAuditActionCode =
  | "tenant.suspended"
  | "tenant.reactivated"
  | "subscription.manual_renewal"
  | "subscription.blackout_forced"
  | "subscription.cancelled"
  | "user.disabled"
  | "user.reactivated"
  | "user.unlocked";

export interface PlatformAuditEvent {
  id: string;
  occurredAt: string;
  actionCode: PlatformAuditActionCode;
  tenantId?: string;
  resourceType: "tenant" | "subscription" | "user";
  resourceId: string;
  /** Spec #2 §55.2/§59 "Manual adjustments require reason and audit" — required for every action this module actually implements. */
  reason?: string;
}

/** Dashboard read-model (Gate 1 §09) — every field traces to a pure derivation over `Tenant[]`/`Subscription[]`, never an independently authored count. */
export interface TenantKpis {
  activeCount: number;
  trialCount: number;
  restrictedCount: number;
}

export interface SubscriptionKpis {
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export interface PlatformUserKpis {
  totalCount: number;
  activeCount: number;
}

/** Gate 2 tenant directory row — one join across `Tenant`/`Subscription`/`SubscriptionPlan`/`PlatformUserTenantMembership`/`PlatformUser`, built once by `buildTenantDirectoryRows` and never re-derived ad hoc in a component. */
export interface TenantDirectoryRow {
  tenantId: string;
  name: string;
  specialty: CabinetSpecialty;
  ownerName: string | null;
  planCode: PlanCode | null;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  tenantStatus: TenantStatus;
  createdAt: string;
  currentPeriodEnd: string | null;
  userCount: number;
}

/** Gate 3 subscription directory row — one join across `Subscription`/`Tenant`/`SubscriptionPlan`. */
export interface SubscriptionDirectoryRow {
  subscriptionId: string;
  tenantId: string;
  tenantName: string;
  planCode: PlanCode;
  planName: string;
  billingPeriod: Subscription["billingPeriod"];
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  graceEndsAt?: string;
  trialEndsAt?: string;
}

/** Gate 4 platform-user row — one user plus every tenant relationship it holds (task §23 "user/tenant relationships"). */
export interface PlatformUserMembershipSummary {
  tenantId: string;
  tenantName: string;
  profileType: PlatformMembershipProfileType;
  isOwner: boolean;
  status: PlatformMembershipStatus;
}

export interface PlatformUserRow {
  userId: string;
  displayName: string;
  email: string;
  status: UserAccountStatus;
  memberships: PlatformUserMembershipSummary[];
}
