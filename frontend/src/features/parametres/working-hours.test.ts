import { describe, expect, it } from "vitest";
import { getCabinetWorkingHoursMockData } from "./mock-cabinet-working-hours-data";
import { buildInitialWorkingHoursFormValues, buildWorkingHoursFromFormValues, isValidWorkingHoursForm } from "./working-hours";

describe("getCabinetWorkingHoursMockData", () => {
  it("open Monday through Saturday 08:30-18:00, closed Sunday (Spec #9 Screen 05's own worked example)", () => {
    const days = getCabinetWorkingHoursMockData();
    expect(days).toHaveLength(7);
    expect(days.find((day) => day.weekday === "sunday")?.isOpen).toBe(false);
    expect(days.filter((day) => day.isOpen)).toHaveLength(6);
    expect(days.find((day) => day.weekday === "monday")).toMatchObject({ isOpen: true, startTime: "08:30", endTime: "18:00" });
  });
});

describe("buildInitialWorkingHoursFormValues / buildWorkingHoursFromFormValues round-trip", () => {
  it("round-trips the fixture unchanged", () => {
    const days = getCabinetWorkingHoursMockData();
    const values = buildInitialWorkingHoursFormValues(days);
    const rebuilt = buildWorkingHoursFromFormValues(values);
    expect(rebuilt).toEqual(days);
  });

  it("a closed day has empty time fields in form state, never a stale leftover time", () => {
    const values = buildInitialWorkingHoursFormValues(getCabinetWorkingHoursMockData());
    expect(values.sunday).toEqual({ isOpen: false, startTime: "", endTime: "" });
  });
});

describe("isValidWorkingHoursForm", () => {
  it("the fixture's own values are valid", () => {
    expect(isValidWorkingHoursForm(buildInitialWorkingHoursFormValues(getCabinetWorkingHoursMockData()))).toBe(true);
  });

  it("rejects an open day whose end is not after its start", () => {
    const values = buildInitialWorkingHoursFormValues(getCabinetWorkingHoursMockData());
    values.monday = { isOpen: true, startTime: "18:00", endTime: "08:30" };
    expect(isValidWorkingHoursForm(values)).toBe(false);
  });

  it("a closed day's own (ignored) time fields never affect validity", () => {
    const values = buildInitialWorkingHoursFormValues(getCabinetWorkingHoursMockData());
    values.sunday = { isOpen: false, startTime: "18:00", endTime: "08:30" };
    expect(isValidWorkingHoursForm(values)).toBe(true);
  });
});
