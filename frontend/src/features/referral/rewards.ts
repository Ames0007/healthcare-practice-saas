import type { ReferralReward } from "@/components/domain/referral/types";

/** Sum of every *applied* reward's months (task §41: never let a subscription-history figure drift from the real reward records it should equal). */
export function computeAppliedRewardMonths(rewards: ReferralReward[]): number {
  return rewards.filter((reward) => reward.status === "applied").reduce((sum, reward) => sum + reward.rewardMonths, 0);
}

/** The reward (if any) belonging to one referral — a referral can have at most one (Spec #4 §29.3: "One qualifying reward per referral"). */
export function findRewardForReferral(rewards: ReferralReward[], referralId: string): ReferralReward | undefined {
  return rewards.find((reward) => reward.referralId === referralId);
}
