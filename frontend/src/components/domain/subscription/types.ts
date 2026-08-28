/**
 * SaaS subscription domain (UI-011ABC, Spec #4 §28, CLAUDE.md §10/§11).
 * Deliberately separate from `domain/settings/` (`CabinetSettings` is
 * operational cabinet configuration; `Subscription` is the commercial
 * relationship between the platform and the tenant — CLAUDE.md's own
 * "Subscription access and user permissions are different" framing
 * extended one level further: subscription access and cabinet
 * configuration are different too). This is a FRONTEND PROTOTYPE read-
 * model: no payment-provider integration, no real billing, no backend
 * enforcement. `EntitlementService`-style checks shown by this module are
 * illustrative UX only (CLAUDE.md §10) — the future Laravel backend is
 * the sole authority (Spec #5 §40, WF-56: "Backend must block APIs, not
 * only frontend navigation").
 */

/** Spec #4 §28.4 `subscriptions.status` ENUM, verbatim — all 6 values, also CLAUDE.md §11's own "Supported lifecycle" list. */
export type SubscriptionStatus = "trialing" | "active" | "expired" | "grace" | "blackout" | "cancelled";

/** Spec #4 §28.2 `plan_prices.billing_period` ENUM. */
export type BillingPeriod = "monthly" | "annual";

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  billingPeriod: BillingPeriod;
  status: SubscriptionStatus;
  trialStartedAt?: string;
  trialEndsAt?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  graceEndsAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bounded history event (task §19: "trial started, subscription activated,
 * renewal, plan change" — plus `referral_reward_applied`, the one
 * cross-domain event Gate 3's own reconciliation requires, task §41).
 * Deliberately excludes `subscription_payments` (Spec #4 §28.5) — that
 * table stores real provider/amount/reference fields this prototype has
 * no honest way to populate (no payment ever actually occurs here); see
 * `docs/implementation/DECISIONS.md` ADR-010.
 */
export type SubscriptionHistoryEventType = "trial_started" | "activated" | "renewed" | "plan_changed" | "referral_reward_applied";

export interface SubscriptionHistoryEvent {
  id: string;
  occurredAt: string;
  type: SubscriptionHistoryEventType;
  /** Only set for `referral_reward_applied` — the exact months granted, always traceable to a real `ReferralReward.rewardMonths` (never an independently hardcoded number, task §41). */
  months?: number;
}

/**
 * Spec #4 §28.1 `subscription_plans` + §28.2 `plan_prices`, narrowed to
 * two tiers: `solo` and `cabinet`. Spec #2 §50 names a third,
 * "Cabinet+ / Pro if needed" — deliberately not modeled here since the
 * spec's own "if needed" hedge is the only mention anywhere, with zero
 * concrete entitlement or pricing data to back it (ADR-010).
 */
export type PlanCode = "solo" | "cabinet";

export interface SubscriptionPlan {
  id: string;
  code: PlanCode;
  name: string;
  billingPeriodOptions: BillingPeriod[];
  active: boolean;
}

/**
 * `amount` is deliberately `undefined` for every plan/period — Spec #2
 * §50's own words: "Actual MAD prices remain a commercial decision
 * requiring market validation." The task's own hard constraint forbids
 * inventing prices, so this field exists (the schema/UI seam is real) but
 * is never populated with a number (ADR-010).
 */
export interface PlanPrice {
  planId: string;
  billingPeriod: BillingPeriod;
  currencyCode: "MAD";
  amount?: number;
}

/**
 * Spec #4 §28.3 `plan_entitlements.entitlement_code` examples, verbatim —
 * the only entitlement vocabulary anywhere in the approved specifications.
 */
export type EntitlementCode =
  | "max_practitioners"
  | "max_staff"
  | "storage_bytes"
  | "inventory_enabled"
  | "hr_enabled"
  | "commission_enabled";

/**
 * `limitValue` is `undefined` wherever no spec/wireframe gives a concrete
 * number (e.g. `storage_bytes` for both plans, `max_staff` for `solo`) —
 * Screen 47's own wireframe shows "Stockage ..." with no figure. Never
 * filled in with an invented placeholder number (ADR-010).
 */
export interface PlanEntitlement {
  planId: string;
  entitlementCode: EntitlementCode;
  limitValue?: number;
  enabled: boolean;
}
