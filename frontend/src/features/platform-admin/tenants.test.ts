import { describe, expect, it } from "vitest";
import type { Subscription, SubscriptionPlan } from "@/components/domain/subscription/types";
import type { PlatformUser, PlatformUserTenantMembership, Tenant } from "@/components/domain/platform-admin/types";
import {
  applyTenantAction,
  buildTenantDirectoryRows,
  computeTenantKpis,
  EMPTY_TENANT_FILTERS,
  filterTenantDirectoryRows,
  getAvailableTenantActions,
} from "./tenants";

const TENANTS: Tenant[] = [
  { id: "t-1", name: "Cabinet Alpha", slug: "cabinet-alpha", specialty: "general_medicine", status: "active", createdAt: "2026-01-01" },
  { id: "t-2", name: "Cabinet Beta", slug: "cabinet-beta", specialty: "dentistry", status: "suspended", createdAt: "2026-02-01" },
  { id: "t-3", name: "Cabinet Gamma", slug: "cabinet-gamma", specialty: "psychology", status: "closed", createdAt: "2025-01-01" },
];

const PLANS: SubscriptionPlan[] = [
  { id: "plan-solo", code: "solo", name: "Solo", billingPeriodOptions: ["monthly"], active: true },
  { id: "plan-cabinet", code: "cabinet", name: "Cabinet", billingPeriodOptions: ["monthly"], active: true },
];

const SUBSCRIPTIONS: Subscription[] = [
  { id: "s-1", tenantId: "t-1", planId: "plan-cabinet", billingPeriod: "monthly", status: "active", currentPeriodEnd: "2026-09-01", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "s-2", tenantId: "t-2", planId: "plan-solo", billingPeriod: "monthly", status: "blackout", createdAt: "2026-02-01", updatedAt: "2026-02-01" },
  { id: "s-3", tenantId: "t-3", planId: "plan-solo", billingPeriod: "monthly", status: "trialing", trialEndsAt: "2025-02-01", createdAt: "2025-01-01", updatedAt: "2025-01-01" },
];

const USERS: PlatformUser[] = [
  { id: "u-1", displayName: "Owner Alpha", email: "a@t1.test", status: "active", preferredLanguage: "fr" },
  { id: "u-2", displayName: "Owner Beta", email: "b@t2.test", status: "active", preferredLanguage: "fr" },
];

const MEMBERSHIPS: PlatformUserTenantMembership[] = [
  { id: "m-1", userId: "u-1", tenantId: "t-1", profileType: "owner_admin", isOwner: true, status: "active", joinedAt: "2026-01-01" },
  { id: "m-2", userId: "u-2", tenantId: "t-2", profileType: "owner_admin", isOwner: true, status: "active", joinedAt: "2026-02-01" },
];

describe("buildTenantDirectoryRows", () => {
  it("joins tenant, subscription, plan, owner and user count into one row", () => {
    const rows = buildTenantDirectoryRows(TENANTS, SUBSCRIPTIONS, PLANS, MEMBERSHIPS, USERS);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      tenantId: "t-1",
      ownerName: "Owner Alpha",
      planCode: "cabinet",
      subscriptionStatus: "active",
      tenantStatus: "active",
      userCount: 1,
    });
  });

  it("never invents an owner name when no membership models one", () => {
    const rows = buildTenantDirectoryRows(TENANTS, SUBSCRIPTIONS, PLANS, [], USERS);
    expect(rows.every((row) => row.ownerName === null)).toBe(true);
  });

  it("leaves plan/subscription fields null for a tenant with no modeled subscription", () => {
    const rows = buildTenantDirectoryRows(TENANTS, [], PLANS, MEMBERSHIPS, USERS);
    expect(rows[0].planCode).toBeNull();
    expect(rows[0].subscriptionStatus).toBeNull();
  });
});

describe("computeTenantKpis", () => {
  it("counts active tenants by Tenant.status directly", () => {
    expect(computeTenantKpis(TENANTS, SUBSCRIPTIONS).activeCount).toBe(1);
  });

  it("counts trials by subscription status, not tenant status", () => {
    expect(computeTenantKpis(TENANTS, SUBSCRIPTIONS).trialCount).toBe(1);
  });

  it("counts a tenant as restricted once even if both suspended and blackout hold", () => {
    const doublyRestricted: Tenant[] = [{ ...TENANTS[1] }];
    const kpis = computeTenantKpis(doublyRestricted, SUBSCRIPTIONS);
    expect(kpis.restrictedCount).toBe(1);
  });

  it("union of suspended tenants and blackout subscriptions never double counts", () => {
    expect(computeTenantKpis(TENANTS, SUBSCRIPTIONS).restrictedCount).toBe(1);
  });
});

describe("filterTenantDirectoryRows", () => {
  const rows = buildTenantDirectoryRows(TENANTS, SUBSCRIPTIONS, PLANS, MEMBERSHIPS, USERS);

  it("returns every row for the empty filter set", () => {
    expect(filterTenantDirectoryRows(rows, EMPTY_TENANT_FILTERS)).toHaveLength(3);
  });

  it("matches by tenant name substring, case-insensitively", () => {
    const result = filterTenantDirectoryRows(rows, { ...EMPTY_TENANT_FILTERS, query: "beta" });
    expect(result.map((row) => row.tenantId)).toEqual(["t-2"]);
  });

  it("matches by owner name substring", () => {
    const result = filterTenantDirectoryRows(rows, { ...EMPTY_TENANT_FILTERS, query: "owner alpha" });
    expect(result.map((row) => row.tenantId)).toEqual(["t-1"]);
  });

  it("filters by exact plan code", () => {
    const result = filterTenantDirectoryRows(rows, { ...EMPTY_TENANT_FILTERS, planCode: "cabinet" });
    expect(result.map((row) => row.tenantId)).toEqual(["t-1"]);
  });

  it("filters by exact tenant status", () => {
    const result = filterTenantDirectoryRows(rows, { ...EMPTY_TENANT_FILTERS, status: "closed" });
    expect(result.map((row) => row.tenantId)).toEqual(["t-3"]);
  });

  it("combines query and filters with AND semantics", () => {
    const result = filterTenantDirectoryRows(rows, { query: "cabinet", planCode: "solo", status: "suspended" });
    expect(result.map((row) => row.tenantId)).toEqual(["t-2"]);
  });
});

describe("tenant status actions", () => {
  it("offers only suspend from active", () => {
    expect(getAvailableTenantActions("active")).toEqual(["tenant.suspended"]);
  });

  it("offers only reactivate from suspended", () => {
    expect(getAvailableTenantActions("suspended")).toEqual(["tenant.reactivated"]);
  });

  it("offers no action from closed — terminal, never reopened (task §1 no destructive/reversal action invented)", () => {
    expect(getAvailableTenantActions("closed")).toEqual([]);
  });

  it("applyTenantAction(tenant.suspended) moves active to suspended", () => {
    expect(applyTenantAction(TENANTS[0], "tenant.suspended").status).toBe("suspended");
  });

  it("applyTenantAction(tenant.reactivated) moves suspended to active", () => {
    expect(applyTenantAction(TENANTS[1], "tenant.reactivated").status).toBe("active");
  });

  it("never mutates the input tenant object", () => {
    const original = { ...TENANTS[0] };
    applyTenantAction(TENANTS[0], "tenant.suspended");
    expect(TENANTS[0]).toEqual(original);
  });
});
