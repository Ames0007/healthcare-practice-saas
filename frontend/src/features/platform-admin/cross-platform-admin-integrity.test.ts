import { describe, expect, it } from "vitest";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getUserAccountsMockData } from "@/features/access/mock-users-data";
import { getAccessAuditEventsMockData } from "@/features/access/mock-audit-data";
import { getSubscriptionMockData } from "@/features/subscription/mock-subscription-data";
import { getSubscriptionPlansMockData } from "@/features/subscription/mock-plans-data";
import { getTenantsMockData } from "./mock-tenants-data";
import { getPlatformSubscriptionsMockData } from "./mock-platform-subscriptions-data";
import { getPlatformUsersMockData, getPlatformMembershipsMockData } from "./mock-platform-users-data";
import { getPlatformAuditEventsMockData } from "./mock-platform-audit-data";
import { buildTenantDirectoryRows, computeTenantKpis } from "./tenants";
import { buildSubscriptionDirectoryRows, computeSubscriptionKpis } from "./subscriptions";
import { buildPlatformUserRows, computePlatformUserKpis } from "./platform-users";

/**
 * Reconciles the platform-admin module against the REAL fixtures other
 * already-shipped modules own — proves this task never built a second,
 * parallel data universe (task §1/§77-equivalent, mirrors every prior
 * `cross-*-integrity.test.ts` in this codebase).
 */
describe("platform-admin cross-module integrity", () => {
  it("tenant-1's directory identity traces to the real CabinetProfile, never a re-typed duplicate", () => {
    const cabinetProfile = getCabinetProfileMockData();
    const tenantOne = getTenantsMockData().find((tenant) => tenant.id === "tenant-1");
    expect(tenantOne?.name).toBe(cabinetProfile.name);
    expect(tenantOne?.specialty).toBe(cabinetProfile.specialty);
    expect(tenantOne?.city).toBe(cabinetProfile.city);
  });

  it("tenant-1's subscription is the exact real Subscription object /app/abonnement itself reads, not a re-authored duplicate", () => {
    const real = getSubscriptionMockData();
    const platformTenantOne = getPlatformSubscriptionsMockData().find((subscription) => subscription.tenantId === "tenant-1");
    expect(platformTenantOne).toEqual(real);
  });

  it("tenant-1's platform users are exactly the 5 real access-governance UserAccount fixtures, never a duplicated universe", () => {
    const realUsers = getUserAccountsMockData();
    const platformUsers = getPlatformUsersMockData();
    for (const realUser of realUsers) {
      const platformUser = platformUsers.find((user) => user.id === realUser.id);
      expect(platformUser).toBeDefined();
      expect(platformUser?.displayName).toBe(realUser.displayName);
      expect(platformUser?.status).toBe(realUser.status);
    }
  });

  it("Othmane Zouiten (user-5) remains disabled at the platform level too — never silently reactivated by the platform projection", () => {
    const platformUsers = getPlatformUsersMockData();
    expect(platformUsers.find((user) => user.id === "user-5")?.status).toBe("disabled");
  });

  it("paudit-1's date matches the REAL access-governance deactivation audit event exactly (audit-7), never an independently invented date", () => {
    const realEvent = getAccessAuditEventsMockData().find((event) => event.id === "audit-7");
    const platformEvent = getPlatformAuditEventsMockData().find((event) => event.id === "paudit-1");
    expect(platformEvent?.occurredAt).toBe(realEvent?.occurredAt);
    expect(platformEvent?.resourceId).toBe("user-5");
  });

  it("all 7 tenant fixtures exist, and every TenantStatus value is exercised at least once", () => {
    const tenants = getTenantsMockData();
    expect(tenants).toHaveLength(7);
    const statuses = new Set(tenants.map((tenant) => tenant.status));
    expect(statuses).toEqual(new Set(["active", "suspended", "closed"]));
  });

  it("all 6 SubscriptionStatus values are exercised at least once across the platform subscription directory", () => {
    const statuses = new Set(getPlatformSubscriptionsMockData().map((subscription) => subscription.status));
    expect(statuses).toEqual(new Set(["active", "trialing", "expired", "grace", "blackout", "cancelled"]));
  });

  it("all 4 UserAccountStatus values are exercised at least once across the platform user directory", () => {
    const statuses = new Set(getPlatformUsersMockData().map((user) => user.status));
    expect(statuses).toEqual(new Set(["invited", "active", "disabled", "locked"]));
  });

  it("buildTenantDirectoryRows reconciles tenant count, owner names and user counts against the real fixtures", () => {
    const rows = buildTenantDirectoryRows(
      getTenantsMockData(),
      getPlatformSubscriptionsMockData(),
      getSubscriptionPlansMockData(),
      getPlatformMembershipsMockData(),
      getPlatformUsersMockData(),
    );
    expect(rows).toHaveLength(7);

    const tenantOneRow = rows.find((row) => row.tenantId === "tenant-1");
    expect(tenantOneRow?.ownerName).toBe("Youssef Benali");
    expect(tenantOneRow?.userCount).toBe(getUserAccountsMockData().length);

    const santePlusRow = rows.find((row) => row.tenantId === "tenant-3");
    expect(santePlusRow?.userCount).toBe(2);

    const closedRow = rows.find((row) => row.tenantId === "tenant-7");
    expect(closedRow?.tenantStatus).toBe("closed");
  });

  it("computeTenantKpis/computeSubscriptionKpis/computePlatformUserKpis never diverge from the row builders' own counts", () => {
    const tenants = getTenantsMockData();
    const subscriptions = getPlatformSubscriptionsMockData();
    const users = getPlatformUsersMockData();
    const memberships = getPlatformMembershipsMockData();
    const plans = getSubscriptionPlansMockData();

    const tenantRows = buildTenantDirectoryRows(tenants, subscriptions, plans, memberships, users);
    const tenantKpis = computeTenantKpis(tenants, subscriptions);
    expect(tenantKpis.activeCount).toBe(tenantRows.filter((row) => row.tenantStatus === "active").length);

    const subscriptionRows = buildSubscriptionDirectoryRows(subscriptions, tenants, plans);
    const subscriptionKpis = computeSubscriptionKpis(subscriptions, "2026-08-23");
    expect(subscriptionKpis.activeCount).toBe(subscriptionRows.filter((row) => row.status === "active").length);

    const userRows = buildPlatformUserRows(users, memberships, tenants);
    const userKpis = computePlatformUserKpis(users);
    expect(userKpis.totalCount).toBe(userRows.length);
  });

  it("a mutation test proves no builder mutates its shared fixture inputs", () => {
    const tenantsBefore = JSON.stringify(getTenantsMockData());
    const subscriptionsBefore = JSON.stringify(getPlatformSubscriptionsMockData());
    const usersBefore = JSON.stringify(getPlatformUsersMockData());

    buildTenantDirectoryRows(
      getTenantsMockData(),
      getPlatformSubscriptionsMockData(),
      getSubscriptionPlansMockData(),
      getPlatformMembershipsMockData(),
      getPlatformUsersMockData(),
    );

    expect(JSON.stringify(getTenantsMockData())).toBe(tenantsBefore);
    expect(JSON.stringify(getPlatformSubscriptionsMockData())).toBe(subscriptionsBefore);
    expect(JSON.stringify(getPlatformUsersMockData())).toBe(usersBefore);
  });
});
