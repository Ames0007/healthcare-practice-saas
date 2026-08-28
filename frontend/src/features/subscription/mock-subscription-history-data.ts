import type { SubscriptionHistoryEvent } from "@/components/domain/subscription/types";

/**
 * Bounded synthetic history (UI-011ABC Gate 1 §19) — exactly the event
 * types the task allows: trial started, activated, renewed, plan changed,
 * plus `referral_reward_applied` (Gate 3's cross-domain reconciliation
 * point, task §41). No payment transaction history — Spec #4 §28.5
 * `subscription_payments` is deliberately not represented here (see
 * `Subscription`'s own doc comment / ADR-010). `months: 1` on the reward
 * event is not independently chosen — `cross-subscription-integrity.test.ts`
 * proves it equals the real `ReferralReward.rewardMonths` for the
 * qualifying referral (`features/referral/mock-referral-data.ts`).
 */
export function getSubscriptionHistoryMockData(): SubscriptionHistoryEvent[] {
  return [
    { id: "sub-hist-1", occurredAt: "2026-02-23", type: "trial_started" },
    { id: "sub-hist-2", occurredAt: "2026-03-09", type: "activated" },
    { id: "sub-hist-3", occurredAt: "2026-07-15", type: "referral_reward_applied", months: 1 },
    { id: "sub-hist-4", occurredAt: "2026-08-23", type: "renewed" },
  ];
}
