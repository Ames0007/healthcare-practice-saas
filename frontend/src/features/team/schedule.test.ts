import { describe, expect, it } from "vitest";
import type { WorkInterval, WorkWeekFormValues } from "@/components/domain/team/types";
import {
  WEEKDAY_ORDER,
  buildInitialWorkWeekFormValues,
  buildIntervalsFromWorkWeekFormValues,
  computeWeeklyScheduledHours,
  getIntervalsForMember,
  groupIntervalsByWeekday,
  intervalsAreSequential,
  isValidWorkInterval,
} from "./schedule";

const morningInterval: WorkInterval = {
  id: "wi-1",
  teamMemberId: "m-1",
  weekday: "monday",
  startTime: "08:30",
  endTime: "12:30",
  active: true,
};

const afternoonInterval: WorkInterval = {
  id: "wi-2",
  teamMemberId: "m-1",
  weekday: "monday",
  startTime: "14:30",
  endTime: "18:30",
  active: true,
};

const tuesdayInterval: WorkInterval = {
  id: "wi-3",
  teamMemberId: "m-1",
  weekday: "tuesday",
  startTime: "09:00",
  endTime: "17:00",
  active: true,
};

describe("getIntervalsForMember", () => {
  it("returns only the given member's own active intervals", () => {
    const other: WorkInterval = { ...tuesdayInterval, id: "wi-other", teamMemberId: "m-2" };
    const inactive: WorkInterval = { ...tuesdayInterval, id: "wi-inactive", active: false };
    expect(getIntervalsForMember([morningInterval, other, inactive], "m-1")).toEqual([morningInterval]);
  });
});

describe("groupIntervalsByWeekday", () => {
  it("groups a split shift onto the same weekday, ordered earliest first regardless of input order", () => {
    const grouped = groupIntervalsByWeekday([afternoonInterval, morningInterval, tuesdayInterval]);

    expect(grouped.monday).toEqual([morningInterval, afternoonInterval]);
    expect(grouped.tuesday).toEqual([tuesdayInterval]);
    expect(grouped.wednesday).toEqual([]);
  });

  it("returns every weekday key even when no intervals exist at all (§ empty schedule)", () => {
    const grouped = groupIntervalsByWeekday([]);
    for (const weekday of WEEKDAY_ORDER) {
      expect(grouped[weekday]).toEqual([]);
    }
  });
});

describe("computeWeeklyScheduledHours", () => {
  it("sums every interval's own duration in hours (§5/§19)", () => {
    expect(computeWeeklyScheduledHours([morningInterval, afternoonInterval, tuesdayInterval])).toBe(4 + 4 + 8);
  });

  it("is zero for an empty schedule", () => {
    expect(computeWeeklyScheduledHours([])).toBe(0);
  });
});

describe("isValidWorkInterval", () => {
  it("accepts a start strictly before the end", () => {
    expect(isValidWorkInterval("08:00", "12:00")).toBe(true);
  });

  it("rejects an empty, equal or reversed range", () => {
    expect(isValidWorkInterval("", "12:00")).toBe(false);
    expect(isValidWorkInterval("08:00", "")).toBe(false);
    expect(isValidWorkInterval("08:00", "08:00")).toBe(false);
    expect(isValidWorkInterval("12:00", "08:00")).toBe(false);
  });
});

describe("intervalsAreSequential", () => {
  it("accepts a second interval starting exactly when the first ends, or later", () => {
    expect(intervalsAreSequential("12:30", "12:30")).toBe(true);
    expect(intervalsAreSequential("12:30", "14:30")).toBe(true);
  });

  it("rejects a second interval starting before the first ends (overlap)", () => {
    expect(intervalsAreSequential("14:30", "12:00")).toBe(false);
  });
});

describe("buildInitialWorkWeekFormValues / buildIntervalsFromWorkWeekFormValues round-trip", () => {
  it("reproduces the exact same interval set it was built from (UI-007B §9)", () => {
    const original = [morningInterval, afternoonInterval, tuesdayInterval];
    const formValues = buildInitialWorkWeekFormValues(original);

    expect(formValues.monday).toEqual({
      worked: true,
      interval1Start: "08:30",
      interval1End: "12:30",
      hasSecondInterval: true,
      interval2Start: "14:30",
      interval2End: "18:30",
    });
    expect(formValues.wednesday.worked).toBe(false);

    const rebuilt = buildIntervalsFromWorkWeekFormValues("m-1", formValues);
    expect(rebuilt).toHaveLength(3);
    expect(computeWeeklyScheduledHours(rebuilt)).toBe(computeWeeklyScheduledHours(original));
  });

  it("produces an empty interval set from an all-rest week", () => {
    const rest = buildInitialWorkWeekFormValues([]);
    expect(buildIntervalsFromWorkWeekFormValues("m-1", rest)).toEqual([]);
  });

  it("omits the second interval entirely when a day's form state does not have one", () => {
    const values = buildInitialWorkWeekFormValues([tuesdayInterval]);
    const rebuilt = buildIntervalsFromWorkWeekFormValues("m-1", values);
    expect(rebuilt).toHaveLength(1);
    expect(rebuilt[0]).toMatchObject({ weekday: "tuesday", startTime: "09:00", endTime: "17:00" });
  });

  it("every rebuilt interval carries the given teamMemberId, never the original's", () => {
    const values: WorkWeekFormValues = buildInitialWorkWeekFormValues([morningInterval]);
    const rebuilt = buildIntervalsFromWorkWeekFormValues("m-2", values);
    expect(rebuilt.every((interval) => interval.teamMemberId === "m-2")).toBe(true);
  });
});
