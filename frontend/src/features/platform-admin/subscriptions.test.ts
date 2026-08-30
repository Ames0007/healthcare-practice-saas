import { describe, expect, it } from "vitest";
import type { Subscription, SubscriptionPlan } from "@/components/domain/subscription/types";
import type { Tenant } from "@/components/domain/platform-admin/types";
import {
  applySubscriptionAction,
  buildSubscriptionDirectoryRows,
  computeSubscriptionKpis,
  getAvailableSubscriptionActions,
} from "./subscriptions";

const BUSINESS_DATE = "2026-08-23";

const TENANTS: Tenant[] = [
  { id: "t-1", name: "Cabinet Alpha", slug: "cabinet-alpha", specialty: "general_medicine", status: "active", createdAt: "2026-01-01" },
  { id: "t-2", name: "Cabinet Beta", slug: "cabinet-beta", specialty: "dentistry", status: "active", createdAt: "2026-01-01" },
];

const PLANS: SubscriptionPlan[] = [{ id: "plan-cabinet", code: "cabinet", name: "Cabinet", billingPeriodOptions: ["monthly"], active: true }];

const SUBSCRIPTIONS: Subscription[] = [
  { id: "s-1", tenantId: "t-1", planId: "plan-cabinet", billingPeriod: "monthly", status: "active", currentPeriodEnd: "2026-09-01", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "s-2", tenantId: "t-2", planId: "plan-cabinet", billingPeriod: "monthly", status: "expired", currentPeriodEnd: "2026-08-01", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

describe("buildSubscriptionDirectoryRows", () => {
  it("joins subscription, tenant name and plan name into one row", () => {
    const rows = buildSubscriptionDirectoryRows(SUBSCRIPTIONS, TENANTS, PLANS);
    expect(rows[0]).toMatchObject({ subscriptionId: "s-1", tenantName: "Cabinet Alpha", planName: "Cabinet", status: "active" });
  });
});

describe("computeSubscriptionKpis", () => {
  it("counts active subscriptions", () => {
    expect(computeSubscriptionKpis(SUBSCRIPTIONS, BUSINESS_DATE).activeCount).toBe(1);
  });

  it("counts expired subscriptions", () => {
    expect(computeSubscriptionKpis(SUBSCRIPTIONS, BUSINESS_DATE).expiredCount).toBe(1);
  });

  it("reuses isExpiringSoon's own D-15 threshold for 'expiring soon' — an active subscription 10 days out counts", () => {
    const soon: Subscription[] = [{ ...SUBSCRIPTIONS[0], currentPeriodEnd: "2026-09-02" }];
    expect(computeSubscriptionKpis(soon, BUSINESS_DATE).expiringSoonCount).toBe(1);
  });

  it("does not count an active subscription more than 15 days out as expiring soon", () => {
    const notSoon: Subscription[] = [{ ...SUBSCRIPTIONS[0], currentPeriodEnd: "2026-10-01" }];
    expect(computeSubscriptionKpis(notSoon, BUSINESS_DATE).expiringSoonCount).toBe(0);
  });

  it("never counts an already-expired subscription as 'expiring soon'", () => {
    expect(computeSubscriptionKpis([SUBSCRIPTIONS[1]], BUSINESS_DATE).expiringSoonCount).toBe(0);
  });
});

describe("subscription status actions", () => {
  it("grace offers renewal, forced blackout and cancellation", () => {
    expect(getAvailableSubscriptionActions("grace")).toEqual([
      "subscription.manual_renewal",
      "subscription.blackout_forced",
      "subscription.cancelled",
    ]);
  });

  it("expired/trialing/blackout offer renewal and cancellation, never a second forced-blackout", () => {
    expect(getAvailableSubscriptionActions("expired")).toEqual(["subscription.manual_renewal", "subscription.cancelled"]);
    expect(getAvailableSubscriptionActions("blackout")).toEqual(["subscription.manual_renewal", "subscription.cancelled"]);
  });

  it("active offers only cancellation", () => {
    expect(getAvailableSubscriptionActions("active")).toEqual(["subscription.cancelled"]);
  });

  it("cancelled is terminal — no action offered", () => {
    expect(getAvailableSubscriptionActions("cancelled")).toEqual([]);
  });

  it("manual renewal restores active with a fresh one-month period from businessDate and clears grace/cancellation", () => {
    const result = applySubscriptionAction(SUBSCRIPTIONS[1], "subscription.manual_renewal", BUSINESS_DATE);
    expect(result.status).toBe("active");
    expect(result.currentPeriodStart).toBe(BUSINESS_DATE);
    expect(result.currentPeriodEnd).toBe("2026-09-23");
    expect(result.graceEndsAt).toBeUndefined();
    expect(result.cancelledAt).toBeUndefined();
  });

  it("forced blackout sets graceEndsAt to businessDate", () => {
    const result = applySubscriptionAction(SUBSCRIPTIONS[0], "subscription.blackout_forced", BUSINESS_DATE);
    expect(result.status).toBe("blackout");
    expect(result.graceEndsAt).toBe(BUSINESS_DATE);
  });

  it("cancellation sets cancelledAt and clears grace", () => {
    const result = applySubscriptionAction(SUBSCRIPTIONS[0], "subscription.cancelled", BUSINESS_DATE);
    expect(result.status).toBe("cancelled");
    expect(result.cancelledAt).toBe(BUSINESS_DATE);
    expect(result.graceEndsAt).toBeUndefined();
  });

  it("never mutates the input subscription object", () => {
    const original = { ...SUBSCRIPTIONS[0] };
    applySubscriptionAction(SUBSCRIPTIONS[0], "subscription.cancelled", BUSINESS_DATE);
    expect(SUBSCRIPTIONS[0]).toEqual(original);
  });
});
