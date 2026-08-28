import { describe, expect, it } from "vitest";
import type { EntitlementCode } from "@/components/domain/subscription/types";
import { getPlanEntitlementsMockData, getPlanPricesMockData, getSubscriptionPlansMockData } from "./mock-plans-data";

const ALL_ENTITLEMENT_CODES: EntitlementCode[] = [
  "max_practitioners",
  "max_staff",
  "storage_bytes",
  "inventory_enabled",
  "hr_enabled",
  "commission_enabled",
];

describe("mock-plans-data", () => {
  it("plan ids are unique", () => {
    const plans = getSubscriptionPlansMockData();
    const ids = plans.map((plan) => plan.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every plan has exactly one entitlement row per known entitlement code (task §33: no gaps, no duplicates)", () => {
    const plans = getSubscriptionPlansMockData();
    const entitlements = getPlanEntitlementsMockData();

    for (const plan of plans) {
      const rows = entitlements.filter((entitlement) => entitlement.planId === plan.id);
      expect(rows.map((row) => row.entitlementCode).sort()).toEqual([...ALL_ENTITLEMENT_CODES].sort());
    }
  });

  it("every entitlement row's planId resolves to a real plan", () => {
    const planIds = new Set(getSubscriptionPlansMockData().map((plan) => plan.id));
    expect(getPlanEntitlementsMockData().every((entitlement) => planIds.has(entitlement.planId))).toBe(true);
  });

  it("every price row's planId resolves to a real plan, and covers every billing period the plan itself declares", () => {
    const plans = getSubscriptionPlansMockData();
    const prices = getPlanPricesMockData();

    for (const plan of plans) {
      const rows = prices.filter((price) => price.planId === plan.id);
      expect(rows.map((row) => row.billingPeriod).sort()).toEqual([...plan.billingPeriodOptions].sort());
    }
  });

  it("no price row ever carries an invented amount — pricing is a deferred commercial decision (Spec #2 §50)", () => {
    expect(getPlanPricesMockData().every((price) => price.amount === undefined)).toBe(true);
  });
});
