import type { EntitlementCode, PlanEntitlement } from "@/components/domain/subscription/types";

/**
 * Centralized entitlement resolution (UI-011ABC Gate 2, task §25, Spec #5
 * §39: "Centralize plan checks... Do not scatter `if plan == '...'`
 * throughout application code"). Every caller reads a plan's access
 * through these three pure functions — no component compares
 * `plan.code`/`plan.name` directly against a string literal.
 *
 * CRITICAL (task §9): this is a frontend UX layer only. `hasEntitlement`
 * explains what the UI *shows*, never what the backend *allows*. Real
 * authorization is the future Laravel backend's sole responsibility
 * (Spec #5 §40, CLAUDE.md §10) — nothing here blocks a single API call,
 * because this prototype makes none.
 */
export function hasEntitlement(entitlements: PlanEntitlement[], planId: string, code: EntitlementCode): boolean {
  return entitlements.some((entitlement) => entitlement.planId === planId && entitlement.entitlementCode === code && entitlement.enabled);
}

export function getEntitlementLimit(entitlements: PlanEntitlement[], planId: string, code: EntitlementCode): number | undefined {
  return entitlements.find((entitlement) => entitlement.planId === planId && entitlement.entitlementCode === code)?.limitValue;
}

export interface UsageState {
  used: number;
  limit?: number;
  /** True once `used` has reached (not necessarily exceeded) `limit`. */
  atLimit: boolean;
  /** True only once `used` has gone strictly past `limit` (WF-74's own scenario). */
  overLimit: boolean;
}

/** `limit === undefined` means "not defined in this prototype" (e.g. storage) — always reads as within bounds, never a false warning over an unset limit. */
export function getUsageState(limit: number | undefined, used: number): UsageState {
  return {
    used,
    limit,
    atLimit: limit !== undefined && used === limit,
    overLimit: limit !== undefined && used > limit,
  };
}
