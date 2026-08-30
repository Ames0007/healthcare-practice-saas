import type { Subscription } from "@/components/domain/subscription/types";
import { getSubscriptionMockData } from "@/features/subscription/mock-subscription-data";
import {
  buildSubscriptionFixture,
  getExpiredSubscriptionMockData,
  getGraceSubscriptionMockData,
  getBlackoutSubscriptionMockData,
  getCancelledSubscriptionMockData,
  getTrialingSubscriptionMockData,
} from "@/features/subscription/mock-subscription-data";

/**
 * Platform-wide subscription directory (UI-013ABCDE Gate 3). `tenant-1`'s
 * row is the exact same `Subscription` object `/app/abonnement` itself
 * reads (`getSubscriptionMockData`) — never a second, independently typed
 * "active" fixture (no duplicate universe). The other six rows are built
 * from the same status-variant builders UI-011ABC already shipped
 * (`getTrialingSubscriptionMockData`, etc.) with only `id`/`tenantId`/
 * `planId`/`createdAt` overridden to point at a different tenant — every
 * date-relationship those builders already prove internally consistent
 * (e.g. grace = expiry + `GRACE_PERIOD_DAYS`) is inherited unchanged, never
 * recomputed by hand a second time.
 */
export function getPlatformSubscriptionsMockData(): Subscription[] {
  const tenantOneSubscription = getSubscriptionMockData();

  return [
    tenantOneSubscription,
    {
      ...getTrialingSubscriptionMockData(),
      id: "sub-2",
      tenantId: "tenant-2",
      planId: "plan-cabinet",
      createdAt: "2026-08-09",
    },
    {
      ...buildSubscriptionFixture({ status: "active", currentPeriodStart: "2026-08-01", currentPeriodEnd: "2026-09-01" }),
      id: "sub-3",
      tenantId: "tenant-3",
      planId: "plan-solo",
      createdAt: "2026-04-01",
    },
    {
      ...getExpiredSubscriptionMockData(),
      id: "sub-4",
      tenantId: "tenant-4",
      planId: "plan-solo",
      createdAt: "2025-08-23",
    },
    {
      ...getGraceSubscriptionMockData(),
      id: "sub-5",
      tenantId: "tenant-5",
      planId: "plan-solo",
      createdAt: "2025-11-23",
    },
    {
      ...getBlackoutSubscriptionMockData(),
      id: "sub-6",
      tenantId: "tenant-6",
      planId: "plan-cabinet",
      createdAt: "2025-06-23",
    },
    {
      ...getCancelledSubscriptionMockData(),
      id: "sub-7",
      tenantId: "tenant-7",
      planId: "plan-cabinet",
      createdAt: "2025-09-01",
    },
  ];
}
