import type { Subscription, SubscriptionPlan } from "@/components/domain/subscription/types";
import type {
  PlatformAuditActionCode,
  SubscriptionDirectoryRow,
  SubscriptionKpis,
  Tenant,
} from "@/components/domain/platform-admin/types";
import { isExpiringSoon } from "@/features/subscription/subscription-lifecycle";

/** One join across `Subscription`/`Tenant`/`SubscriptionPlan` — the single builder every subscription-facing screen reads (Gate 3 §17/§19). */
export function buildSubscriptionDirectoryRows(
  subscriptions: Subscription[],
  tenants: Tenant[],
  plans: SubscriptionPlan[],
): SubscriptionDirectoryRow[] {
  const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  return subscriptions.map((subscription) => {
    const tenant = tenantById.get(subscription.tenantId);
    const plan = planById.get(subscription.planId);
    return {
      subscriptionId: subscription.id,
      tenantId: subscription.tenantId,
      tenantName: tenant?.name ?? subscription.tenantId,
      planCode: plan?.code ?? "solo",
      planName: plan?.name ?? "—",
      billingPeriod: subscription.billingPeriod,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      graceEndsAt: subscription.graceEndsAt,
      trialEndsAt: subscription.trialEndsAt,
    };
  });
}

/**
 * Dashboard KPI derivation (Gate 1 §09, wireframe Screen 54: "Cabinets
 * actifs / Trials / Expirent bientôt / Blackout"). "À renouveler" reuses
 * `isExpiringSoon` (Spec #2 §49.3's own D-15 reminder threshold) against
 * every currently-`active` subscription's `currentPeriodEnd` — never a
 * second, independently chosen day count.
 */
export function computeSubscriptionKpis(subscriptions: Subscription[], businessDate: string): SubscriptionKpis {
  const activeCount = subscriptions.filter((subscription) => subscription.status === "active").length;
  const expiringSoonCount = subscriptions.filter(
    (subscription) =>
      subscription.status === "active" &&
      subscription.currentPeriodEnd !== undefined &&
      isExpiringSoon(subscription.currentPeriodEnd, businessDate),
  ).length;
  const expiredCount = subscriptions.filter((subscription) => subscription.status === "expired").length;

  return { activeCount, expiringSoonCount, expiredCount };
}

/**
 * Bounded administrative actions (task Gate 3 §20, Spec #1 §27's own
 * "Manual renewal/payment recording ... Grace/blackout controls", WF-55/56/
 * 57). Each entry is only offered from the status it makes sense from —
 * never a blanket action list regardless of current state.
 */
export type SubscriptionActionCode = Extract<
  PlatformAuditActionCode,
  "subscription.manual_renewal" | "subscription.blackout_forced" | "subscription.cancelled"
>;

export function getAvailableSubscriptionActions(status: Subscription["status"]): SubscriptionActionCode[] {
  switch (status) {
    case "grace":
      // The one state where either a renewal or an early forced blackout is a meaningful choice (WF-55 steps 3-4).
      return ["subscription.manual_renewal", "subscription.blackout_forced", "subscription.cancelled"];
    case "trialing":
    case "expired":
    case "blackout":
      return ["subscription.manual_renewal", "subscription.cancelled"];
    case "active":
      return ["subscription.cancelled"];
    case "cancelled":
    default:
      return [];
  }
}

/**
 * Applies one bounded action locally (session-only, task §1: "NO real
 * subscription mutation") — WF-57: a manual renewal restores `active` with
 * a fresh monthly period from `businessDate`; forcing blackout sets
 * `graceEndsAt` to now (WF-56); cancelling sets `cancelledAt` (WF-nothing
 * further — data is never deleted, Spec #4 §57.7).
 */
export function applySubscriptionAction(
  subscription: Subscription,
  action: SubscriptionActionCode,
  businessDate: string,
): Subscription {
  switch (action) {
    case "subscription.manual_renewal":
      return {
        ...subscription,
        status: "active",
        currentPeriodStart: businessDate,
        currentPeriodEnd: addOneMonthIso(businessDate),
        graceEndsAt: undefined,
        cancelledAt: undefined,
        updatedAt: businessDate,
      };
    case "subscription.blackout_forced":
      return { ...subscription, status: "blackout", graceEndsAt: businessDate, updatedAt: businessDate };
    case "subscription.cancelled":
      return { ...subscription, status: "cancelled", cancelledAt: businessDate, graceEndsAt: undefined, updatedAt: businessDate };
    default:
      return subscription;
  }
}

function addOneMonthIso(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + 1, day));
  return date.toISOString().slice(0, 10);
}
