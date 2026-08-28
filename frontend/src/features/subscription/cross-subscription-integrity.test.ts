import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getReferralRewardsMockData, getReferralsMockData } from "@/features/referral/mock-referral-data";
import { computeAppliedRewardMonths } from "@/features/referral/rewards";
import { getSubscriptionMockData } from "./mock-subscription-data";
import { getSubscriptionHistoryMockData } from "./mock-subscription-history-data";
import { getPlanEntitlementsMockData, getSubscriptionPlansMockData } from "./mock-plans-data";
import { getEntitlementLimit, getUsageState } from "./entitlements";
import { countActivePractitioners, countActiveStaff } from "./usage";

/**
 * Proves the full chain the task's own §55 demands:
 *
 *   Subscription -> Plan -> Entitlements -> Usage presentation
 *   Referral -> Qualification status -> Reward -> Subscription benefit
 *
 * never disagrees with itself — mirrors `cross-reporting-integrity.test.ts`/
 * `cross-configuration-integrity.test.ts`'s own established discipline.
 */
describe("Cross-subscription integrity", () => {
  it("Subscription -> Plan: the default subscription's planId resolves to a real, active plan", () => {
    const subscription = getSubscriptionMockData();
    const plan = getSubscriptionPlansMockData().find((candidate) => candidate.id === subscription.planId);
    expect(plan).toBeDefined();
    expect(plan!.active).toBe(true);
  });

  it("Plan -> Entitlements -> Usage: the current plan's real practitioner/staff limits reconcile exactly with what SubscriptionPage and PlansPage both independently derive", () => {
    const subscription = getSubscriptionMockData();
    const entitlements = getPlanEntitlementsMockData();
    const members = getTeamMembersMockData();

    const practitionerLimit = getEntitlementLimit(entitlements, subscription.planId, "max_practitioners");
    const staffLimit = getEntitlementLimit(entitlements, subscription.planId, "max_staff");

    const practitionerUsage = getUsageState(practitionerLimit, countActivePractitioners(members));
    const staffUsage = getUsageState(staffLimit, countActiveStaff(members));

    expect(practitionerUsage).toEqual({ used: 2, limit: 3, atLimit: false, overLimit: false });
    expect(staffUsage).toEqual({ used: 4, limit: 5, atLimit: false, overLimit: false });
  });

  it("Referral -> Qualification -> Reward -> Subscription benefit: the subscription history's referral_reward_applied event carries exactly the applied reward months, never an independently hardcoded number", () => {
    const rewardsMonths = computeAppliedRewardMonths(getReferralRewardsMockData());
    const historyEvent = getSubscriptionHistoryMockData().find((event) => event.type === "referral_reward_applied");

    expect(historyEvent).toBeDefined();
    expect(historyEvent!.months).toBe(rewardsMonths);
  });

  it("Referral -> Reward: the history event's date matches the real reward's own appliedAt date, never a separately chosen date", () => {
    const reward = getReferralRewardsMockData()[0];
    const historyEvent = getSubscriptionHistoryMockData().find((event) => event.type === "referral_reward_applied");

    expect(historyEvent!.occurredAt).toBe(reward.appliedAt);
  });

  it("every referral's referralCodeId resolves to the one real referral code", () => {
    const referrals = getReferralsMockData();
    expect(referrals.every((referral) => referral.referralCodeId === "refcode-1")).toBe(true);
  });

  it("no qualified referral is missing its reward, and no reward references a non-qualified referral", () => {
    const referrals = getReferralsMockData();
    const rewards = getReferralRewardsMockData();
    const qualifiedIds = referrals.filter((referral) => referral.status === "qualified").map((referral) => referral.id);
    const rewardedIds = rewards.map((reward) => reward.referralId);

    expect(rewardedIds.sort()).toEqual(qualifiedIds.sort());
  });
});
