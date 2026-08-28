import { describe, expect, it } from "vitest";
import { isClosedExceptionType } from "./calendar-exceptions";
import { getCabinetCalendarExceptionsMockData } from "./mock-calendar-exceptions-data";

describe("getCabinetCalendarExceptionsMockData — fixture integrity", () => {
  const exceptions = getCabinetCalendarExceptionsMockData();

  it("has unique ids", () => {
    const ids = exceptions.map((exception) => exception.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has at most one active exception per date", () => {
    const activeDates = exceptions.filter((exception) => exception.active).map((exception) => exception.date);
    expect(new Set(activeDates).size).toBe(activeDates.length);
  });

  it("every closed-type exception (public_holiday/exceptional_closure/rest_day) has zero intervals", () => {
    for (const exception of exceptions) {
      if (isClosedExceptionType(exception.type)) {
        expect(exception.intervals).toEqual([]);
      }
    }
  });

  it("every open-type exception (modified_hours/exceptional_opening) has at least one interval", () => {
    for (const exception of exceptions) {
      if (!isClosedExceptionType(exception.type)) {
        expect(exception.intervals.length).toBeGreaterThan(0);
      }
    }
  });

  it("covers all 5 exception types at least once", () => {
    const types = new Set(exceptions.map((exception) => exception.type));
    expect(types).toEqual(
      new Set(["public_holiday", "exceptional_closure", "rest_day", "modified_hours", "exceptional_opening"]),
    );
  });

  it("includes both a past and a future exception, demonstrating both lifecycle branches", () => {
    const businessDate = "2026-08-23";
    expect(exceptions.some((exception) => exception.date < businessDate)).toBe(true);
    expect(exceptions.some((exception) => exception.date >= businessDate)).toBe(true);
  });
});
