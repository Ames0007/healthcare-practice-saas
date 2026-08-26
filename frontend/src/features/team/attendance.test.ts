import { describe, expect, it } from "vitest";
import type { WorkInterval } from "@/components/domain/team/types";
import {
  computeAttendance,
  computeEarlyDepartureMinutes,
  computeExpectedMinutes,
  computeLateMinutes,
  computeOvertimeMinutes,
  computeWorkedMinutes,
  getAttendanceForDate,
  getAttendanceForMember,
  getExpectedIntervalsForDate,
  isBusinessDateInPast,
  resolveAttendanceStatus,
  resolveCabinetBucket,
  summarizeCabinetAttendance,
} from "./attendance";

const splitShiftMonday: WorkInterval[] = [
  { id: "wi-1", teamMemberId: "m-1", weekday: "monday", startTime: "08:30", endTime: "12:30", active: true },
  { id: "wi-2", teamMemberId: "m-1", weekday: "monday", startTime: "14:30", endTime: "18:30", active: true },
];

const singleIntervalMonday: WorkInterval[] = [
  { id: "wi-3", teamMemberId: "m-2", weekday: "monday", startTime: "08:00", endTime: "16:00", active: true },
];

describe("getExpectedIntervalsForDate", () => {
  it("resolves the correct weekday's own intervals from a real ISO date (§15)", () => {
    // 2026-08-17 is a Monday.
    const intervals: WorkInterval[] = [...splitShiftMonday, { ...splitShiftMonday[0], id: "wi-tue", weekday: "tuesday" }];
    expect(getExpectedIntervalsForDate(intervals, "m-1", "2026-08-17")).toEqual(splitShiftMonday);
  });

  it("returns an empty array for a rest day (§25)", () => {
    expect(getExpectedIntervalsForDate(splitShiftMonday, "m-1", "2026-08-16")).toEqual([]); // Sunday
  });
});

describe("computeExpectedMinutes", () => {
  it("sums a split-shift day's own two intervals", () => {
    expect(computeExpectedMinutes(splitShiftMonday)).toBe(4 * 60 + 4 * 60);
  });
});

describe("computeWorkedMinutes (§18 — never counts an unpaid gap as worked time)", () => {
  it("excludes the lunch-break gap for a split-shift day", () => {
    expect(computeWorkedMinutes("08:30", "18:30", splitShiftMonday)).toBe(8 * 60);
  });

  it("does not simply subtract first-start from final-end without removing the gap", () => {
    // A naive "final - first" calculation would give 600 minutes (10h); the gap-aware one gives 480 (8h).
    const naive = 18 * 60 + 30 - (8 * 60 + 30);
    expect(computeWorkedMinutes("08:30", "18:30", splitShiftMonday)).not.toBe(naive);
  });

  it("is a plain span for a single-interval day (no gap to remove)", () => {
    expect(computeWorkedMinutes("08:00", "16:00", singleIntervalMonday)).toBe(8 * 60);
  });

  it("is zero for a reversed or zero-length span", () => {
    expect(computeWorkedMinutes("16:00", "08:00", singleIntervalMonday)).toBe(0);
  });
});

describe("computeLateMinutes", () => {
  it("is zero when on time or early", () => {
    expect(computeLateMinutes("08:00", singleIntervalMonday)).toBe(0);
    expect(computeLateMinutes("07:55", singleIntervalMonday)).toBe(0);
  });

  it("matches the task's own worked example (Expected 08:30, Actual 08:37, Late = 7 min, §17)", () => {
    expect(computeLateMinutes("08:37", splitShiftMonday)).toBe(7);
  });
});

describe("computeEarlyDepartureMinutes", () => {
  it("is zero when leaving at or after the expected end", () => {
    expect(computeEarlyDepartureMinutes("16:00", singleIntervalMonday)).toBe(0);
    expect(computeEarlyDepartureMinutes("16:30", singleIntervalMonday)).toBe(0);
  });

  it("is positive when leaving before the expected end", () => {
    expect(computeEarlyDepartureMinutes("15:45", singleIntervalMonday)).toBe(15);
  });
});

describe("computeOvertimeMinutes", () => {
  it("matches the task's own worked example (Expected 8h, Actual 8h45, Overtime = 45 min, §21)", () => {
    expect(computeOvertimeMinutes(8 * 60 + 45, 8 * 60)).toBe(45);
  });

  it("is never negative", () => {
    expect(computeOvertimeMinutes(6 * 60, 8 * 60)).toBe(0);
  });
});

describe("computeAttendance", () => {
  it("bundles every calculation consistently for a split-shift overtime day", () => {
    const result = computeAttendance({ checkIn: "08:30", checkOut: "18:45" }, splitShiftMonday);
    expect(result.expectedMinutes).toBe(480);
    expect(result.workedMinutes).toBe(495);
    expect(result.lateMinutes).toBe(0);
    expect(result.earlyDepartureMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(15);
  });

  it("returns all zeros before any check-in exists", () => {
    const result = computeAttendance({}, singleIntervalMonday);
    expect(result.workedMinutes).toBe(0);
    expect(result.lateMinutes).toBe(0);
    expect(result.overtimeMinutes).toBe(0);
  });
});

describe("resolveAttendanceStatus", () => {
  it("is null on a rest day regardless of any check-in data (§25)", () => {
    expect(resolveAttendanceStatus({ checkIn: "08:00" }, [], true)).toBeNull();
  });

  it("is not_checked_in for today with no check-in yet", () => {
    expect(resolveAttendanceStatus({}, singleIntervalMonday, false)).toBe("not_checked_in");
  });

  it("is absent for a past work day with no check-in (§24 — never confused with approved leave, which is applied by the caller)", () => {
    expect(resolveAttendanceStatus({}, singleIntervalMonday, true)).toBe("absent");
  });

  it("is present once checked in on time, with no check-out yet", () => {
    expect(resolveAttendanceStatus({ checkIn: "08:00" }, singleIntervalMonday, false)).toBe("present");
  });

  it("is late once checked in late, with no check-out yet", () => {
    expect(resolveAttendanceStatus({ checkIn: "08:15" }, singleIntervalMonday, false)).toBe("late");
  });

  it("is completed once checked out, regardless of lateness", () => {
    expect(resolveAttendanceStatus({ checkIn: "08:15", checkOut: "16:00" }, singleIntervalMonday, false)).toBe("completed");
  });

  it("never produces a payroll amount of any kind (§25 — no money in this module)", () => {
    const result = computeAttendance({ checkIn: "08:00", checkOut: "18:00" }, splitShiftMonday);
    expect(result).not.toHaveProperty("amount");
    expect(result).not.toHaveProperty("payAmount");
    expect(result).not.toHaveProperty("overtimeAmount");
  });
});

describe("resolveCabinetBucket / summarizeCabinetAttendance (§22)", () => {
  it("puts a late day in 'late' even once completed, never 'present'", () => {
    expect(resolveCabinetBucket("completed", 12)).toBe("late");
    expect(resolveCabinetBucket("completed", 0)).toBe("present");
  });

  it("is null on a rest day and excluded from every summary count", () => {
    expect(resolveCabinetBucket(null, 0)).toBeNull();
    expect(summarizeCabinetAttendance([null, "present"])).toEqual({ present: 1, late: 0, absent: 0, notCheckedIn: 0 });
  });

  it("counts each bucket independently", () => {
    expect(summarizeCabinetAttendance(["present", "present", "late", "absent", "not_checked_in"])).toEqual({
      present: 2,
      late: 1,
      absent: 1,
      notCheckedIn: 1,
    });
  });
});

describe("getAttendanceForMember / getAttendanceForDate / isBusinessDateInPast", () => {
  it("filters to only the given member's own records, newest first", () => {
    const records = [
      { id: "a", teamMemberId: "m-1", businessDate: "2026-08-17" },
      { id: "b", teamMemberId: "m-2", businessDate: "2026-08-18" },
      { id: "c", teamMemberId: "m-1", businessDate: "2026-08-19" },
    ];
    expect(getAttendanceForMember(records, "m-1").map((r) => r.id)).toEqual(["c", "a"]);
  });

  it("finds the exact record for one member on one date, or null", () => {
    const records = [{ id: "a", teamMemberId: "m-1", businessDate: "2026-08-17" }];
    expect(getAttendanceForDate(records, "m-1", "2026-08-17")?.id).toBe("a");
    expect(getAttendanceForDate(records, "m-1", "2026-08-18")).toBeNull();
  });

  it("compares ISO dates correctly", () => {
    expect(isBusinessDateInPast("2026-08-17", "2026-08-23")).toBe(true);
    expect(isBusinessDateInPast("2026-08-23", "2026-08-23")).toBe(false);
    expect(isBusinessDateInPast("2026-08-24", "2026-08-23")).toBe(false);
  });
});
