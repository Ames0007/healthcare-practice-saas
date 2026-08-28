import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { computeDaysBetween, GRACE_PERIOD_DAYS } from "./subscription-lifecycle";
import {
  getBlackoutSubscriptionMockData,
  getCancelledSubscriptionMockData,
  getExpiredSubscriptionMockData,
  getGraceSubscriptionMockData,
  getSubscriptionMockData,
  getTrialingSubscriptionMockData,
} from "./mock-subscription-data";

describe("mock-subscription-data", () => {
  it("the default fixture is Active on the Cabinet plan, reproducing Screen 47's own worked example exactly", () => {
    const subscription = getSubscriptionMockData();
    expect(subscription.status).toBe("active");
    expect(subscription.planId).toBe("plan-cabinet");
    expect(subscription.billingPeriod).toBe("monthly");
    expect(subscription.currentPeriodEnd).toBe("2026-09-23");
  });

  it("every fixture status matches the function's own name", () => {
    expect(getTrialingSubscriptionMockData().status).toBe("trialing");
    expect(getExpiredSubscriptionMockData().status).toBe("expired");
    expect(getGraceSubscriptionMockData().status).toBe("grace");
    expect(getBlackoutSubscriptionMockData().status).toBe("blackout");
    expect(getCancelledSubscriptionMockData().status).toBe("cancelled");
  });

  it("the trialing fixture's trial end date is still in the future relative to the business date", () => {
    const subscription = getTrialingSubscriptionMockData();
    expect(subscription.trialEndsAt).toBeDefined();
    expect(computeDaysBetween(MOCK_BUSINESS_DATE, subscription.trialEndsAt!)).toBeGreaterThan(0);
  });

  it("the grace fixture's graceEndsAt is exactly currentPeriodEnd + GRACE_PERIOD_DAYS, never an independently typed date", () => {
    const subscription = getGraceSubscriptionMockData();
    expect(computeDaysBetween(subscription.currentPeriodEnd!, subscription.graceEndsAt!)).toBe(GRACE_PERIOD_DAYS);
  });

  it("the grace fixture is still within its own grace window as of the business date", () => {
    const subscription = getGraceSubscriptionMockData();
    expect(computeDaysBetween(MOCK_BUSINESS_DATE, subscription.graceEndsAt!)).toBeGreaterThan(0);
  });

  it("the blackout fixture's grace window has already fully elapsed as of the business date", () => {
    const subscription = getBlackoutSubscriptionMockData();
    expect(computeDaysBetween(subscription.currentPeriodEnd!, subscription.graceEndsAt!)).toBe(GRACE_PERIOD_DAYS);
    expect(computeDaysBetween(MOCK_BUSINESS_DATE, subscription.graceEndsAt!)).toBeLessThan(0);
  });

  it("the expired fixture's currentPeriodEnd is exactly the business date (the D0 moment, WF-55 step 2)", () => {
    expect(getExpiredSubscriptionMockData().currentPeriodEnd).toBe(MOCK_BUSINESS_DATE);
  });
});
