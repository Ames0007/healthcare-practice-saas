/**
 * Referral / Parrainage domain (UI-011ABC Gate 3, Spec #4 §29). A
 * separate SaaS-domain concept from `domain/subscription/` (task §34) —
 * related only through `ReferralReward` (Gate 3) feeding a
 * `SubscriptionHistoryEvent` of type `referral_reward_applied` (Gate 1),
 * never through a shared entity.
 */

export interface ReferralCode {
  id: string;
  tenantId: string;
  code: string;
  active: boolean;
  createdAt: string;
}

/** Spec #4 §29.2 `referrals.status` ENUM, verbatim — all 6 values. */
export type ReferralStatus = "attributed" | "trial" | "paid_pending_validation" | "qualified" | "rejected" | "voided";

/**
 * `referredTenantName` is a frontend read-model enrichment, not a
 * persisted schema field — Spec #4 §29.2 only stores `referred_tenant_id`
 * (a real FK a backend would join through). This prototype has no second
 * tenant record to join against, so a display name is carried directly
 * on the fixture, mirroring `PractitionerActivityRow`'s own "read-model
 * row shape projecting existing/external identity" precedent
 * (`features/rapports/`).
 */
export interface Referral {
  id: string;
  referrerTenantId: string;
  referredTenantName?: string;
  referralCodeId: string;
  status: ReferralStatus;
  attributedAt: string;
  firstPaidAt?: string;
  validationEndsAt?: string;
  qualifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

/** Spec #4 §29.3 `referral_rewards.reward_type` ENUM — exactly one value exists anywhere in the approved specifications (never an invented cash/discount type). */
export type ReferralRewardType = "free_subscription_time";

export type ReferralRewardStatus = "pending" | "applied" | "voided";

/**
 * `rewardMonths` is always `1` in this prototype's fixtures — Spec #2
 * §51.2/WF-59 both say "+1 free subscription month," the only concrete
 * reward figure anywhere in the approved specifications. The field
 * itself is a real `INTEGER` (Spec #4 §29.3), not hardcoded to 1 in the
 * type — a future qualifying referral could in principle earn a
 * different amount if policy changes, this prototype just never shows
 * one since no other figure is ever specified.
 */
export interface ReferralReward {
  id: string;
  referralId: string;
  beneficiaryTenantId: string;
  rewardType: ReferralRewardType;
  rewardMonths: number;
  status: ReferralRewardStatus;
  appliedAt?: string;
  createdAt: string;
}
