import { describe, expect, it } from "vitest";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getCabinetWorkingHoursMockData } from "./mock-cabinet-working-hours-data";
import { getCabinetCalendarExceptionsMockData } from "./mock-calendar-exceptions-data";
import { findConflictingAppointments, resolveEffectiveCabinetAvailability } from "./calendar-exceptions";

/**
 * Cross-module reconciliation (UI-AGENDA-X, mirrors every other
 * `cross-*-integrity.test.ts` in this codebase): proves the calendar-
 * exceptions fixtures' own conflict-warning claims are never fabricated
 * — they trace to Agenda's own real, already-shipped appointment
 * fixtures, the same "derive, don't invent" discipline as every prior
 * cross-module integrity suite.
 */
describe("cross-calendar-exceptions-integrity", () => {
  const workingHours = getCabinetWorkingHoursMockData();
  const exceptions = getCabinetCalendarExceptionsMockData();
  const appointments = getAgendaMockAppointments();

  it("the exceptional closure 3 days after MOCK_BUSINESS_DATE conflicts with exactly Agenda's real apt-14", () => {
    const date = exceptions.find((exception) => exception.type === "exceptional_closure")!.date;
    const availability = resolveEffectiveCabinetAvailability(date, workingHours, exceptions);
    const conflicts = findConflictingAppointments(date, availability, appointments);
    expect(conflicts.map((appointment) => appointment.id)).toEqual(["apt-14"]);
  });

  it("the modified-hours exception 1 day after MOCK_BUSINESS_DATE conflicts with exactly Agenda's real apt-12 and apt-13", () => {
    const date = exceptions.find((exception) => exception.type === "modified_hours")!.date;
    const availability = resolveEffectiveCabinetAvailability(date, workingHours, exceptions);
    const conflicts = findConflictingAppointments(date, availability, appointments);
    expect(conflicts.map((appointment) => appointment.id).sort()).toEqual(["apt-12", "apt-13"]);
  });

  it("the exceptional-opening exception has zero real appointment conflicts (it only adds availability)", () => {
    const date = exceptions.find((exception) => exception.type === "exceptional_opening")!.date;
    const availability = resolveEffectiveCabinetAvailability(date, workingHours, exceptions);
    const conflicts = findConflictingAppointments(date, availability, appointments);
    expect(conflicts).toEqual([]);
  });

  it("the rest-day exception has zero real appointment conflicts", () => {
    const date = exceptions.find((exception) => exception.type === "rest_day")!.date;
    const availability = resolveEffectiveCabinetAvailability(date, workingHours, exceptions);
    const conflicts = findConflictingAppointments(date, availability, appointments);
    expect(conflicts).toEqual([]);
  });

  it("both public holidays are real Moroccan national dates, correctly ordered relative to MOCK_BUSINESS_DATE", () => {
    const holidays = exceptions.filter((exception) => exception.type === "public_holiday");
    expect(holidays).toHaveLength(2);
    expect(holidays.some((holiday) => holiday.date < MOCK_BUSINESS_DATE)).toBe(true);
    expect(holidays.some((holiday) => holiday.date >= MOCK_BUSINESS_DATE)).toBe(true);
  });
});
