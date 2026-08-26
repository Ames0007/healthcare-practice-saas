import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "./mock-data";
import { getContractsMockData } from "./mock-contracts-data";
import { getWorkIntervalsMockData } from "./mock-schedule-data";
import { getCurrentContract } from "./contracts";
import { computeWeeklyScheduledHours, getIntervalsForMember, intervalsAreSequential, isValidWorkInterval } from "./schedule";

describe("getWorkIntervalsMockData fixture integrity (UI-007B §5-7)", () => {
  it("every interval's teamMemberId resolves to a real TeamMember", () => {
    const members = getTeamMembersMockData();
    const memberIds = new Set(members.map((member) => member.id));

    for (const interval of getWorkIntervalsMockData()) {
      expect(memberIds.has(interval.teamMemberId)).toBe(true);
    }
  });

  it("every interval is individually valid (start strictly before end)", () => {
    for (const interval of getWorkIntervalsMockData()) {
      expect(isValidWorkInterval(interval.startTime, interval.endTime)).toBe(true);
    }
  });

  it("no member has overlapping intervals on the same weekday", () => {
    const intervals = getWorkIntervalsMockData();
    const byMemberAndDay = new Map<string, typeof intervals>();

    for (const interval of intervals) {
      const key = `${interval.teamMemberId}-${interval.weekday}`;
      const existing = byMemberAndDay.get(key) ?? [];
      byMemberAndDay.set(key, [...existing, interval]);
    }

    for (const dayIntervals of byMemberAndDay.values()) {
      const sorted = [...dayIntervals].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < sorted.length; i += 1) {
        expect(intervalsAreSequential(sorted[i - 1].endTime, sorted[i].startTime)).toBe(true);
      }
    }
  });

  it("includes at least one real multi-interval (split-shift) day, demonstrating §7", () => {
    const intervals = getWorkIntervalsMockData();
    const byMemberAndDay = new Map<string, number>();
    for (const interval of intervals) {
      const key = `${interval.teamMemberId}-${interval.weekday}`;
      byMemberAndDay.set(key, (byMemberAndDay.get(key) ?? 0) + 1);
    }
    expect([...byMemberAndDay.values()].some((count) => count > 1)).toBe(true);
  });

  it("includes at least one member with no schedule at all (empty-state demo)", () => {
    const members = getTeamMembersMockData();
    const intervals = getWorkIntervalsMockData();
    const scheduledMemberIds = new Set(intervals.map((interval) => interval.teamMemberId));
    expect(members.some((member) => !scheduledMemberIds.has(member.id))).toBe(true);
  });

  it("every member's own computed weekly scheduled hours match their own current contract's weeklyHours exactly", () => {
    const contracts = getContractsMockData();
    const intervals = getWorkIntervalsMockData();
    const scheduledMemberIds = new Set(intervals.map((interval) => interval.teamMemberId));

    for (const memberId of scheduledMemberIds) {
      const contract = getCurrentContract(contracts, memberId);
      if (!contract || contract.weeklyHours === undefined) continue;

      const scheduledHours = computeWeeklyScheduledHours(getIntervalsForMember(intervals, memberId));
      expect(scheduledHours).toBe(contract.weeklyHours);
    }
  });
});
