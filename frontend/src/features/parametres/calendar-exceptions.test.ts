import { describe, expect, it } from "vitest";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { CabinetCalendarException, CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import {
  areIntervalsValid,
  buildCalendarExceptionFromFormValues,
  findConflictingAppointments,
  groupExceptionsByMonth,
  hasActiveExceptionForDate,
  isPastException,
  resolveEffectiveCabinetAvailability,
  validateCalendarExceptionForm,
} from "./calendar-exceptions";

const MESSAGES = {
  dateRequired: "date required",
  intervalsRequired: "intervals required",
  intervalsInvalid: "intervals invalid",
  duplicateDate: "duplicate date",
};

const WORKING_HOURS: CabinetWorkingHoursDay[] = [
  { weekday: "monday", isOpen: true, startTime: "08:30", endTime: "18:00" },
  { weekday: "tuesday", isOpen: true, startTime: "08:30", endTime: "18:00" },
  { weekday: "wednesday", isOpen: true, startTime: "08:30", endTime: "18:00" },
  { weekday: "thursday", isOpen: true, startTime: "08:30", endTime: "18:00" },
  { weekday: "friday", isOpen: true, startTime: "08:30", endTime: "18:00" },
  { weekday: "saturday", isOpen: true, startTime: "09:00", endTime: "13:00" },
  { weekday: "sunday", isOpen: false },
];

function buildException(overrides: Partial<CabinetCalendarException>): CabinetCalendarException {
  return {
    id: "cal-exc-x",
    date: "2026-08-26",
    type: "exceptional_closure",
    intervals: [],
    createdAt: "2026-08-01",
    active: true,
    ...overrides,
  };
}

describe("isPastException", () => {
  it("a date before businessDate is past", () => {
    expect(isPastException("2026-08-01", "2026-08-23")).toBe(true);
  });

  it("businessDate itself is not past — still editable", () => {
    expect(isPastException("2026-08-23", "2026-08-23")).toBe(false);
  });

  it("a future date is not past", () => {
    expect(isPastException("2026-09-01", "2026-08-23")).toBe(false);
  });
});

describe("areIntervalsValid", () => {
  it("rejects an empty interval list", () => {
    expect(areIntervalsValid([])).toBe(false);
  });

  it("rejects end before/equal to start", () => {
    expect(areIntervalsValid([{ startTime: "10:00", endTime: "09:00" }])).toBe(false);
    expect(areIntervalsValid([{ startTime: "10:00", endTime: "10:00" }])).toBe(false);
  });

  it("accepts a single valid interval", () => {
    expect(areIntervalsValid([{ startTime: "09:00", endTime: "13:00" }])).toBe(true);
  });

  it("accepts two sequential non-overlapping intervals regardless of input order", () => {
    expect(
      areIntervalsValid([
        { startTime: "14:00", endTime: "16:00" },
        { startTime: "09:00", endTime: "12:00" },
      ]),
    ).toBe(true);
  });

  it("rejects two overlapping intervals", () => {
    expect(
      areIntervalsValid([
        { startTime: "09:00", endTime: "13:00" },
        { startTime: "12:00", endTime: "15:00" },
      ]),
    ).toBe(false);
  });
});

describe("hasActiveExceptionForDate / duplicate-date policy", () => {
  const exceptions = [buildException({ id: "a", date: "2026-08-26", active: true })];

  it("detects an active exception on the same date", () => {
    expect(hasActiveExceptionForDate(exceptions, "2026-08-26")).toBe(true);
  });

  it("excludes the exception being edited", () => {
    expect(hasActiveExceptionForDate(exceptions, "2026-08-26", "a")).toBe(false);
  });

  it("ignores a different date", () => {
    expect(hasActiveExceptionForDate(exceptions, "2026-08-27")).toBe(false);
  });
});

describe("validateCalendarExceptionForm", () => {
  const exceptions = [buildException({ id: "existing", date: "2026-08-26" })];

  it("requires a date", () => {
    const errors = validateCalendarExceptionForm(
      { date: "", type: "public_holiday", reason: "", intervals: [] },
      exceptions,
      undefined,
      MESSAGES,
    );
    expect(errors.date).toBe(MESSAGES.dateRequired);
  });

  it("rejects a duplicate active date", () => {
    const errors = validateCalendarExceptionForm(
      { date: "2026-08-26", type: "rest_day", reason: "", intervals: [] },
      exceptions,
      undefined,
      MESSAGES,
    );
    expect(errors.duplicate).toBe(MESSAGES.duplicateDate);
  });

  it("allows editing the same exception on its own date (excludeId)", () => {
    const errors = validateCalendarExceptionForm(
      { date: "2026-08-26", type: "rest_day", reason: "", intervals: [] },
      exceptions,
      "existing",
      MESSAGES,
    );
    expect(errors.duplicate).toBeUndefined();
  });

  it("a closed type (public_holiday) never requires intervals", () => {
    const errors = validateCalendarExceptionForm(
      { date: "2026-09-10", type: "public_holiday", reason: "", intervals: [] },
      [],
      undefined,
      MESSAGES,
    );
    expect(errors.intervals).toBeUndefined();
  });

  it("modified_hours requires at least one interval", () => {
    const errors = validateCalendarExceptionForm(
      { date: "2026-09-10", type: "modified_hours", reason: "", intervals: [] },
      [],
      undefined,
      MESSAGES,
    );
    expect(errors.intervals).toBe(MESSAGES.intervalsRequired);
  });

  it("exceptional_opening requires at least one valid interval", () => {
    const errors = validateCalendarExceptionForm(
      { date: "2026-09-10", type: "exceptional_opening", reason: "", intervals: [{ startTime: "10:00", endTime: "09:00" }] },
      [],
      undefined,
      MESSAGES,
    );
    expect(errors.intervals).toBe(MESSAGES.intervalsInvalid);
  });
});

describe("buildCalendarExceptionFromFormValues", () => {
  it("a closed type always persists an empty intervals array, even with stale form intervals", () => {
    const exception = buildCalendarExceptionFromFormValues(
      { date: "2026-09-10", type: "rest_day", reason: "", intervals: [{ startTime: "09:00", endTime: "12:00" }] },
      "cal-exc-new",
      "2026-08-23",
    );
    expect(exception.intervals).toEqual([]);
  });

  it("an open type keeps its intervals", () => {
    const exception = buildCalendarExceptionFromFormValues(
      { date: "2026-09-10", type: "modified_hours", reason: "Réunion", intervals: [{ startTime: "13:00", endTime: "18:00" }] },
      "cal-exc-new",
      "2026-08-23",
    );
    expect(exception.intervals).toEqual([{ startTime: "13:00", endTime: "18:00" }]);
    expect(exception.reason).toBe("Réunion");
  });

  it("a blank reason is stored as undefined, never an empty string", () => {
    const exception = buildCalendarExceptionFromFormValues(
      { date: "2026-09-10", type: "rest_day", reason: "   ", intervals: [] },
      "cal-exc-new",
      "2026-08-23",
    );
    expect(exception.reason).toBeUndefined();
  });
});

describe("resolveEffectiveCabinetAvailability — the centralized resolver", () => {
  it("with no exception, a normal weekday resolves the weekly schedule", () => {
    const result = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, []);
    expect(result.source).toBe("weekly_schedule");
    expect(result.isOpen).toBe(true);
    expect(result.intervals).toEqual([{ startTime: "08:30", endTime: "18:00" }]);
  });

  it("with no exception, a normally-closed Sunday resolves closed", () => {
    const result = resolveEffectiveCabinetAvailability("2026-08-23", WORKING_HOURS, []);
    expect(result.source).toBe("weekly_schedule");
    expect(result.isOpen).toBe(false);
    expect(result.intervals).toEqual([]);
  });

  it("public_holiday overrides an otherwise-open weekday to closed", () => {
    const exceptions = [buildException({ date: "2026-08-24", type: "public_holiday" })];
    const result = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, exceptions);
    expect(result.source).toBe("calendar_exception");
    expect(result.isOpen).toBe(false);
    expect(result.intervals).toEqual([]);
  });

  it("exceptional_closure overrides an otherwise-open weekday to closed", () => {
    const exceptions = [buildException({ date: "2026-08-24", type: "exceptional_closure" })];
    const result = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, exceptions);
    expect(result.isOpen).toBe(false);
  });

  it("rest_day overrides an otherwise-open weekday to closed", () => {
    const exceptions = [buildException({ date: "2026-08-24", type: "rest_day" })];
    const result = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, exceptions);
    expect(result.isOpen).toBe(false);
  });

  it("modified_hours REPLACES the weekly interval — never a union with normal hours", () => {
    const exceptions = [
      buildException({ date: "2026-08-24", type: "modified_hours", intervals: [{ startTime: "10:00", endTime: "13:00" }, { startTime: "14:00", endTime: "16:00" }] }),
    ];
    const result = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, exceptions);
    expect(result.isOpen).toBe(true);
    expect(result.intervals).toEqual([
      { startTime: "10:00", endTime: "13:00" },
      { startTime: "14:00", endTime: "16:00" },
    ]);
    // Never the normal 08:30–18:00 interval leaking through alongside the override.
    expect(result.intervals).not.toContainEqual({ startTime: "08:30", endTime: "18:00" });
  });

  it("exceptional_opening opens a normally-closed Sunday", () => {
    const exceptions = [buildException({ date: "2026-08-23", type: "exceptional_opening", intervals: [{ startTime: "09:00", endTime: "13:00" }] })];
    const result = resolveEffectiveCabinetAvailability("2026-08-23", WORKING_HOURS, exceptions);
    expect(result.source).toBe("calendar_exception");
    expect(result.isOpen).toBe(true);
    expect(result.intervals).toEqual([{ startTime: "09:00", endTime: "13:00" }]);
  });

  it("removing the exception restores the weekly schedule for that date", () => {
    const withException = [buildException({ date: "2026-08-24", type: "exceptional_closure" })];
    const afterRemoval = withException.filter((exception) => exception.id !== "cal-exc-x");

    const before = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, withException);
    const after = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, afterRemoval);

    expect(before.isOpen).toBe(false);
    expect(after.source).toBe("weekly_schedule");
    expect(after.isOpen).toBe(true);
  });

  it("an inactive exception is ignored — falls back to the weekly schedule", () => {
    const exceptions = [buildException({ date: "2026-08-24", type: "exceptional_closure", active: false })];
    const result = resolveEffectiveCabinetAvailability("2026-08-24", WORKING_HOURS, exceptions);
    expect(result.source).toBe("weekly_schedule");
    expect(result.isOpen).toBe(true);
  });
});

describe("findConflictingAppointments — real, never-fabricated conflict detection", () => {
  const appointments: AgendaAppointment[] = [
    {
      id: "apt-a",
      date: "2026-08-26",
      schedulingType: "exact",
      time: "16:00",
      durationMinutes: 30,
      patientId: "pat-1",
      patientName: "Ahmed",
      practitionerId: "prac-1",
      practitionerName: "Dr Benali",
      service: "Suivi",
      status: "requested",
    },
    {
      id: "apt-b",
      date: "2026-08-26",
      schedulingType: "exact",
      time: "10:00",
      durationMinutes: 30,
      patientId: "pat-2",
      patientName: "Fatima",
      practitionerId: "prac-1",
      practitionerName: "Dr Benali",
      service: "Consultation",
      status: "no_show",
    },
  ];

  it("a full-day closure conflicts with every non-terminal appointment that day, excluding terminal statuses", () => {
    const availability = resolveEffectiveCabinetAvailability("2026-08-26", WORKING_HOURS, [
      buildException({ date: "2026-08-26", type: "exceptional_closure" }),
    ]);
    const conflicts = findConflictingAppointments("2026-08-26", availability, appointments);
    expect(conflicts.map((appointment) => appointment.id)).toEqual(["apt-a"]);
  });

  it("modified hours conflict only with appointments outside the reduced window", () => {
    const availability = resolveEffectiveCabinetAvailability("2026-08-26", WORKING_HOURS, [
      buildException({ date: "2026-08-26", type: "modified_hours", intervals: [{ startTime: "08:30", endTime: "12:00" }] }),
    ]);
    // apt-a (16:00) falls outside 08:30–12:00; apt-b is no_show (terminal, excluded).
    const conflicts = findConflictingAppointments("2026-08-26", availability, appointments);
    expect(conflicts.map((appointment) => appointment.id)).toEqual(["apt-a"]);
  });

  it("no conflict when the appointment falls fully inside the effective interval", () => {
    const availability = resolveEffectiveCabinetAvailability("2026-08-26", WORKING_HOURS, [
      buildException({ date: "2026-08-26", type: "modified_hours", intervals: [{ startTime: "08:30", endTime: "18:00" }] }),
    ]);
    const conflicts = findConflictingAppointments("2026-08-26", availability, appointments);
    expect(conflicts).toEqual([]);
  });

  it("never mutates the appointments array", () => {
    const snapshot = JSON.parse(JSON.stringify(appointments));
    const availability = resolveEffectiveCabinetAvailability("2026-08-26", WORKING_HOURS, [
      buildException({ date: "2026-08-26", type: "exceptional_closure" }),
    ]);
    findConflictingAppointments("2026-08-26", availability, appointments);
    expect(appointments).toEqual(snapshot);
  });
});

describe("groupExceptionsByMonth", () => {
  it("groups chronologically by month, never by fixture insertion order", () => {
    const exceptions = [
      buildException({ id: "b", date: "2026-11-06" }),
      buildException({ id: "a", date: "2026-08-24" }),
      buildException({ id: "c", date: "2026-08-30" }),
    ];
    const groups = groupExceptionsByMonth(exceptions, "fr");
    expect(groups.map((group) => group.monthKey)).toEqual(["2026-08", "2026-11"]);
    expect(groups[0].exceptions.map((exception) => exception.id)).toEqual(["a", "c"]);
  });
});
