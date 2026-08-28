import { describe, expect, it } from "vitest";
import type { ReferralReward } from "@/components/domain/referral/types";
import { getReferralRewardsMockData } from "./mock-referral-data";
import { computeAppliedRewardMonths, findRewardForReferral } from "./rewards";

describe("rewards", () => {
  it("computeAppliedRewardMonths sums only applied rewards", () => {
    const rewards: ReferralReward[] = [
      { id: "r1", referralId: "ref-a", beneficiaryTenantId: "t1", rewardType: "free_subscription_time", rewardMonths: 1, status: "applied", createdAt: "2026-01-01" },
      { id: "r2", referralId: "ref-b", beneficiaryTenantId: "t1", rewardType: "free_subscription_time", rewardMonths: 1, status: "pending", createdAt: "2026-01-01" },
      { id: "r3", referralId: "ref-c", beneficiaryTenantId: "t1", rewardType: "free_subscription_time", rewardMonths: 1, status: "voided", createdAt: "2026-01-01" },
    ];
    expect(computeAppliedRewardMonths(rewards)).toBe(1);
  });

  it("computeAppliedRewardMonths on the real fixture equals exactly 1 (the sole qualified referral's own reward)", () => {
    expect(computeAppliedRewardMonths(getReferralRewardsMockData())).toBe(1);
  });

  it("findRewardForReferral returns undefined when no reward exists for the given referral", () => {
    expect(findRewardForReferral(getReferralRewardsMockData(), "ref-1")).toBeUndefined();
  });

  it("findRewardForReferral returns the matching reward for the qualified referral", () => {
    const reward = findRewardForReferral(getReferralRewardsMockData(), "ref-2");
    expect(reward?.id).toBe("reward-1");
  });
});
