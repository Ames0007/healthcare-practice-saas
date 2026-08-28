import type { Referral, ReferralCode, ReferralReward } from "@/components/domain/referral/types";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { buildReferralCode } from "./referral-code";

/** Derives the code from the same Cabinet profile fixture Cabinet Settings itself reads — never an independently invented code (mirrors `buildDefaultDocumentFooter`'s own derive-not-duplicate discipline, UI-010BC ADR-009). */
export function getReferralCodeMockData(): ReferralCode {
  return {
    id: "refcode-1",
    tenantId: "tenant-1",
    code: buildReferralCode(getCabinetProfileMockData().name),
    active: true,
    createdAt: "2026-02-23",
  };
}

/**
 * Five referrals spanning five of the six real statuses (Spec #4 §29.2
 * ENUM) — `voided` is exercised separately by
 * `cross-subscription-integrity.test.ts` rather than a sixth fixture row,
 * to keep the customer-facing list restrained (Screen 50's own wireframe
 * shows only two rows). `ref-2` is the sole `qualified` referral — its
 * `getReferralRewardsMockData` counterpart is the only reward row,
 * honoring "One qualifying reward per referral" (Spec #4 §29.3).
 */
export function getReferralsMockData(): Referral[] {
  return [
    {
      id: "ref-1",
      referrerTenantId: "tenant-1",
      referredTenantName: "Cabinet Atlas",
      referralCodeId: "refcode-1",
      status: "trial",
      attributedAt: "2026-08-01",
      createdAt: "2026-08-01",
      updatedAt: "2026-08-01",
    },
    {
      id: "ref-2",
      referrerTenantId: "tenant-1",
      referredTenantName: "Cabinet Santé Plus",
      referralCodeId: "refcode-1",
      status: "qualified",
      attributedAt: "2026-06-01",
      firstPaidAt: "2026-06-20",
      validationEndsAt: "2026-07-05",
      qualifiedAt: "2026-07-06",
      createdAt: "2026-06-01",
      updatedAt: "2026-07-06",
    },
    {
      id: "ref-3",
      referrerTenantId: "tenant-1",
      referredTenantName: "Cabinet Ennasr",
      referralCodeId: "refcode-1",
      status: "paid_pending_validation",
      attributedAt: "2026-08-10",
      firstPaidAt: "2026-08-15",
      validationEndsAt: "2026-08-29",
      createdAt: "2026-08-10",
      updatedAt: "2026-08-15",
    },
    {
      id: "ref-4",
      referrerTenantId: "tenant-1",
      referredTenantName: "Cabinet Riad Kiné",
      referralCodeId: "refcode-1",
      status: "attributed",
      attributedAt: "2026-08-20",
      createdAt: "2026-08-20",
      updatedAt: "2026-08-20",
    },
    {
      id: "ref-5",
      referrerTenantId: "tenant-1",
      referredTenantName: "Cabinet Zenith",
      referralCodeId: "refcode-1",
      status: "rejected",
      attributedAt: "2026-05-01",
      rejectionReason: "Signal de similarité détecté lors de la revue (WF-60).",
      createdAt: "2026-05-01",
      updatedAt: "2026-05-10",
    },
  ];
}

/** `appliedAt` (2026-07-15) matches `getSubscriptionHistoryMockData`'s own `referral_reward_applied` event date exactly — proven by `cross-subscription-integrity.test.ts`, never independently typed twice. */
export function getReferralRewardsMockData(): ReferralReward[] {
  return [
    {
      id: "reward-1",
      referralId: "ref-2",
      beneficiaryTenantId: "tenant-1",
      rewardType: "free_subscription_time",
      rewardMonths: 1,
      status: "applied",
      appliedAt: "2026-07-15",
      createdAt: "2026-07-06",
    },
  ];
}
