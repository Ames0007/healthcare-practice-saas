import type { Subscription } from "@/components/domain/subscription/types";
import { addDaysIso } from "@/features/agenda/format";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { GRACE_PERIOD_DAYS } from "./subscription-lifecycle";

/**
 * Centralized synthetic Subscription fixture (UI-011ABC Gate 1). The
 * baseline (`buildSubscriptionFixture`'s own defaults) reproduces Spec #9
 * Screen 47's exact worked example: plan Cabinet, status Active, monthly
 * billing, next renewal "23 septembre 2026" — exactly one month after
 * `MOCK_BUSINESS_DATE` ("2026-08-23"), the same canonical prototype
 * "today" every other module already reuses (never `Date.now()`). Every
 * other status variant below is derived from the same base via
 * `addDaysIso`, never an independently typed date literal, so every
 * fixture's own internal date relationships (e.g. grace = expiry +
 * `GRACE_PERIOD_DAYS`) are provably consistent rather than coincidental.
 */
export function buildSubscriptionFixture(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: "sub-1",
    tenantId: "tenant-1",
    planId: "plan-cabinet",
    billingPeriod: "monthly",
    status: "active",
    currentPeriodStart: "2026-08-23",
    currentPeriodEnd: "2026-09-23",
    createdAt: "2026-02-23",
    updatedAt: MOCK_BUSINESS_DATE,
    ...overrides,
  };
}

/** The canonical default state shown at `/app/abonnement` — Screen 47's own steady-state example. */
export function getSubscriptionMockData(): Subscription {
  return buildSubscriptionFixture();
}

/**
 * WF-53: trial subscriptions activate "full/defined trial entitlements" —
 * modeled as trialing on the more inclusive `plan-cabinet` tier (task's
 * own field list for this state, Spec #2 §6.7/§49.1, is "Trial status /
 * Trial end date / Selected plan" — no trial-length figure is ever shown,
 * since none is specified anywhere).
 */
export function getTrialingSubscriptionMockData(): Subscription {
  return buildSubscriptionFixture({
    status: "trialing",
    trialStartedAt: "2026-07-01",
    trialEndsAt: addDaysIso(MOCK_BUSINESS_DATE, 7),
    currentPeriodStart: undefined,
    currentPeriodEnd: undefined,
  });
}

/** WF-55 step 2: the D0 moment of expiry, before the 3-day grace window begins. */
export function getExpiredSubscriptionMockData(): Subscription {
  return buildSubscriptionFixture({
    status: "expired",
    currentPeriodEnd: MOCK_BUSINESS_DATE,
  });
}

/** WF-55 steps 3-4: two days into the 3-day grace window (Spec #2 §49.3) — one day remains before blackout. */
export function getGraceSubscriptionMockData(): Subscription {
  const expiredAt = addDaysIso(MOCK_BUSINESS_DATE, -2);
  return buildSubscriptionFixture({
    status: "grace",
    currentPeriodEnd: expiredAt,
    graceEndsAt: addDaysIso(expiredAt, GRACE_PERIOD_DAYS),
  });
}

/** WF-55 step 6: still unpaid after the 3-day grace window has fully elapsed. */
export function getBlackoutSubscriptionMockData(): Subscription {
  const expiredAt = addDaysIso(MOCK_BUSINESS_DATE, -10);
  return buildSubscriptionFixture({
    status: "blackout",
    currentPeriodEnd: expiredAt,
    graceEndsAt: addDaysIso(expiredAt, GRACE_PERIOD_DAYS),
  });
}

export function getCancelledSubscriptionMockData(): Subscription {
  return buildSubscriptionFixture({
    status: "cancelled",
    cancelledAt: addDaysIso(MOCK_BUSINESS_DATE, -5),
    graceEndsAt: undefined,
  });
}
