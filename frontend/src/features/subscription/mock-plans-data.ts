import type { PlanEntitlement, PlanPrice, SubscriptionPlan } from "@/components/domain/subscription/types";

/**
 * Centralized synthetic Plan catalog (UI-011ABC). Two tiers only — `solo`
 * and `cabinet` — per `PlanCode`'s own doc comment (Cabinet+/Pro
 * deliberately omitted, ADR-010). `billingPeriodOptions` includes both
 * ENUM values (Spec #4 §28.2) for both plans — nothing in the approved
 * specifications restricts either plan to a single billing period.
 */
export function getSubscriptionPlansMockData(): SubscriptionPlan[] {
  return [
    { id: "plan-solo", code: "solo", name: "Solo", billingPeriodOptions: ["monthly", "annual"], active: true },
    { id: "plan-cabinet", code: "cabinet", name: "Cabinet", billingPeriodOptions: ["monthly", "annual"], active: true },
  ];
}

/**
 * `amount` is `undefined` for every row — see `PlanPrice`'s own doc
 * comment (Spec #2 §50: pricing "remains a commercial decision requiring
 * market validation"). The rows themselves (one per plan/period
 * combination) still model the real shape Spec #4 §28.2 defines.
 */
export function getPlanPricesMockData(): PlanPrice[] {
  return [
    { planId: "plan-solo", billingPeriod: "monthly", currencyCode: "MAD" },
    { planId: "plan-solo", billingPeriod: "annual", currencyCode: "MAD" },
    { planId: "plan-cabinet", billingPeriod: "monthly", currencyCode: "MAD" },
    { planId: "plan-cabinet", billingPeriod: "annual", currencyCode: "MAD" },
  ];
}

/**
 * Every `limitValue` traces to a real source: `plan-cabinet`'s
 * `max_practitioners`/`max_staff` reproduce Spec #9 Screen 47's own
 * worked example ("Praticiens 2/3", "Personnel 1/5" — the denominators,
 * 3 and 5) verbatim. `plan-solo`'s `max_practitioners: 1` is the plan's
 * own defining characteristic (a "Solo" plan is, by definition, one
 * practitioner), not an invented commercial number. Every other
 * `limitValue` (`plan-solo.max_staff`, `storage_bytes` on both plans) is
 * deliberately absent — no wireframe or spec text gives either a figure
 * (Screen 47 itself shows "Stockage ..." with no number). Boolean
 * entitlements are `enabled: true` on both plans: Stock/Pharmacie
 * (UI-008), Équipe/HR (UI-007) and Commissions (UI-007CDEF) are already
 * fully built and reachable from the sidebar for every tenant regardless
 * of plan — no existing screen in this prototype actually gates on plan,
 * so presenting a plan-differentiated boolean here would contradict the
 * rest of the application (ADR-010).
 */
export function getPlanEntitlementsMockData(): PlanEntitlement[] {
  return [
    { planId: "plan-solo", entitlementCode: "max_practitioners", limitValue: 1, enabled: true },
    { planId: "plan-solo", entitlementCode: "max_staff", enabled: true },
    { planId: "plan-solo", entitlementCode: "storage_bytes", enabled: true },
    { planId: "plan-solo", entitlementCode: "inventory_enabled", enabled: true },
    { planId: "plan-solo", entitlementCode: "hr_enabled", enabled: true },
    { planId: "plan-solo", entitlementCode: "commission_enabled", enabled: true },

    { planId: "plan-cabinet", entitlementCode: "max_practitioners", limitValue: 3, enabled: true },
    { planId: "plan-cabinet", entitlementCode: "max_staff", limitValue: 5, enabled: true },
    { planId: "plan-cabinet", entitlementCode: "storage_bytes", enabled: true },
    { planId: "plan-cabinet", entitlementCode: "inventory_enabled", enabled: true },
    { planId: "plan-cabinet", entitlementCode: "hr_enabled", enabled: true },
    { planId: "plan-cabinet", entitlementCode: "commission_enabled", enabled: true },
  ];
}
