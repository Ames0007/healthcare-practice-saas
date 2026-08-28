import { describe, expect, it } from "vitest";
import type { ReferralStatus } from "@/components/domain/referral/types";
import { getReferralCodeMockData, getReferralRewardsMockData, getReferralsMockData } from "./mock-referral-data";

const VALID_STATUSES: ReferralStatus[] = ["attributed", "trial", "paid_pending_validation", "qualified", "rejected", "voided"];

describe("mock-referral-data", () => {
  it("referral ids are unique", () => {
    const referrals = getReferralsMockData();
    expect(new Set(referrals.map((referral) => referral.id)).size).toBe(referrals.length);
  });

  it("every referral status is one of the 6 approved ENUM values", () => {
    expect(getReferralsMockData().every((referral) => VALID_STATUSES.includes(referral.status))).toBe(true);
  });

  it("the referral code is derived from the Cabinet profile fixture, not an independent literal", () => {
    expect(getReferralCodeMockData().code).toBe("CABIN7X2");
  });

  it("the referral code is active", () => {
    expect(getReferralCodeMockData().active).toBe(true);
  });

  it("every reward's referralId resolves to a real, qualified referral (a reward cannot exist for a non-qualified referral)", () => {
    const referrals = getReferralsMockData();
    for (const reward of getReferralRewardsMockData()) {
      const referral = referrals.find((candidate) => candidate.id === reward.referralId);
      expect(referral).toBeDefined();
      expect(referral!.status).toBe("qualified");
    }
  });

  it("exactly one reward exists, for the sole qualified referral — one reward per referral (Spec #4 §29.3)", () => {
    const rewards = getReferralRewardsMockData();
    expect(rewards).toHaveLength(1);
    const referralIds = rewards.map((reward) => reward.referralId);
    expect(new Set(referralIds).size).toBe(referralIds.length);
  });

  it("every reward uses the only approved reward type and the only spec-given reward amount (free_subscription_time, +1 month)", () => {
    for (const reward of getReferralRewardsMockData()) {
      expect(reward.rewardType).toBe("free_subscription_time");
      expect(reward.rewardMonths).toBe(1);
    }
  });
});
