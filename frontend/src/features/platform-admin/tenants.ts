import type { Subscription, SubscriptionPlan } from "@/components/domain/subscription/types";
import type {
  PlatformAuditActionCode,
  PlatformUser,
  PlatformUserTenantMembership,
  Tenant,
  TenantDirectoryRow,
  TenantKpis,
  TenantStatus,
} from "@/components/domain/platform-admin/types";
import { countTenantUsers, findTenantOwnerName } from "./platform-users";

/** One join across `Tenant`/`Subscription`/`SubscriptionPlan`/memberships — the single builder every tenant-facing screen reads (Gate 2 §11/§12/§14). */
export function buildTenantDirectoryRows(
  tenants: Tenant[],
  subscriptions: Subscription[],
  plans: SubscriptionPlan[],
  memberships: PlatformUserTenantMembership[],
  users: PlatformUser[],
): TenantDirectoryRow[] {
  const subscriptionByTenantId = new Map(subscriptions.map((subscription) => [subscription.tenantId, subscription]));
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  return tenants.map((tenant) => {
    const subscription = subscriptionByTenantId.get(tenant.id);
    const plan = subscription ? planById.get(subscription.planId) : undefined;

    return {
      tenantId: tenant.id,
      name: tenant.name,
      specialty: tenant.specialty,
      ownerName: findTenantOwnerName(tenant.id, memberships, users),
      planCode: plan?.code ?? null,
      planName: plan?.name ?? null,
      subscriptionStatus: subscription?.status ?? null,
      tenantStatus: tenant.status,
      createdAt: tenant.createdAt,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      userCount: countTenantUsers(tenant.id, memberships),
    };
  });
}

/**
 * Dashboard "CABINETS" KPIs (Gate 1 §09/§10, wireframe Screen 54).
 * `activeCount` reads `Tenant.status` directly (Spec #4 §5.1). `trialCount`
 * and `restrictedCount` are cross-domain derivations — "trial"/"restricted"
 * are subscription-lifecycle concepts (Spec #4 §57.7's own "never infer one
 * domain status solely from another" is respected by deriving both from
 * `Subscription.status`/`Tenant.status` explicitly rather than inventing a
 * third combined field): `restrictedCount` counts a tenant once even if
 * both `tenant.status === "suspended"` AND its subscription is `blackout`
 * hold simultaneously (WF-56's operational restriction and an admin's
 * separate tenant-level suspension are both "restricted," never double
 * counted).
 */
export function computeTenantKpis(tenants: Tenant[], subscriptions: Subscription[]): TenantKpis {
  const subscriptionByTenantId = new Map(subscriptions.map((subscription) => [subscription.tenantId, subscription]));

  const activeCount = tenants.filter((tenant) => tenant.status === "active").length;
  const trialCount = tenants.filter((tenant) => subscriptionByTenantId.get(tenant.id)?.status === "trialing").length;
  const restrictedCount = tenants.filter((tenant) => {
    const subscriptionStatus = subscriptionByTenantId.get(tenant.id)?.status;
    return tenant.status === "suspended" || subscriptionStatus === "blackout";
  }).length;

  return { activeCount, trialCount, restrictedCount };
}

export interface TenantDirectoryFilters {
  query: string;
  planCode: string;
  status: string;
}

export const EMPTY_TENANT_FILTERS: TenantDirectoryFilters = { query: "", planCode: "", status: "" };

/** Gate 2 §13 search/filter — name/owner substring match plus optional plan/status equality, never a server round-trip (CLAUDE.md §46 still applies conceptually: bounded local fixture set only). */
export function filterTenantDirectoryRows(rows: TenantDirectoryRow[], filters: TenantDirectoryFilters): TenantDirectoryRow[] {
  const query = filters.query.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesQuery =
      query.length === 0 ||
      row.name.toLowerCase().includes(query) ||
      (row.ownerName?.toLowerCase().includes(query) ?? false);
    const matchesPlan = filters.planCode.length === 0 || row.planCode === filters.planCode;
    const matchesStatus = filters.status.length === 0 || row.tenantStatus === filters.status;
    return matchesQuery && matchesPlan && matchesStatus;
  });
}

/**
 * Bounded tenant-status actions (Gate 2 §15, Spec #2 §55.2 "Actions must be
 * controlled and audited"). `closed` is terminal — never offered a further
 * action (task §1: "NO destructive tenant deletion", and nothing in Spec
 * #4 §5.1 describes reopening a closed tenant).
 */
export type TenantActionCode = Extract<PlatformAuditActionCode, "tenant.suspended" | "tenant.reactivated">;

export function getAvailableTenantActions(status: TenantStatus): TenantActionCode[] {
  switch (status) {
    case "active":
      return ["tenant.suspended"];
    case "suspended":
      return ["tenant.reactivated"];
    case "closed":
    default:
      return [];
  }
}

export function applyTenantAction(tenant: Tenant, action: TenantActionCode): Tenant {
  switch (action) {
    case "tenant.suspended":
      return { ...tenant, status: "suspended" };
    case "tenant.reactivated":
      return { ...tenant, status: "active" };
    default:
      return tenant;
  }
}
