import { describe, expect, it } from "vitest";
import type { CabinetCalendarException, CabinetService, CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import type { LeaveRequest, TeamMember } from "@/components/domain/team/types";
import type { AgendaAppointment, AgendaPractitioner } from "@/features/agenda/types";
import {
  BOOKING_SLOT_STEP_MINUTES,
  type AvailabilitySources,
  computeOccupiedIntervals,
  doesAppointmentBlockAvailability,
  generateCandidateSlots,
  getBookableServices,
  getDayAvailability,
  getMonthAvailability,
  getSchedulablePractitioners,
  intersectIntervals,
  isPastDate,
  isServiceBookable,
} from "./availability";
import type { SchedulablePractitioner } from "./types";

const BUSINESS_DATE = "2026-08-24"; // a Monday
const NOW_TIME = "08:00";

const SERVICE: CabinetService = {
  id: "svc-1",
  name: "Consultation",
  durationMinutes: 30,
  price: 400,
  schedulingMode: "exact",
  active: true,
};

const INACTIVE_SERVICE: CabinetService = { ...SERVICE, id: "svc-5", active: false };

const PRACTITIONER: SchedulablePractitioner = {
  teamMemberId: "team-1",
  practitionerId: "pr-1",
  name: "Dr. Benali",
  professionalTitle: "Médecin",
};

const WORKING_HOURS: CabinetWorkingHoursDay[] = [
  { weekday: "monday", isOpen: true, startTime: "08:30", endTime: "12:30" },
  { weekday: "tuesday", isOpen: true, startTime: "08:30", endTime: "18:00" },
  { weekday: "sunday", isOpen: false },
];

const WORK_INTERVALS = [
  { teamMemberId: "team-1", weekday: "monday", startTime: "09:00", endTime: "12:00", active: true },
  { teamMemberId: "team-1", weekday: "tuesday", startTime: "08:30", endTime: "12:30", active: true },
  { teamMemberId: "team-1", weekday: "tuesday", startTime: "14:00", endTime: "18:00", active: true },
];

function buildSources(overrides: Partial<AvailabilitySources> = {}): AvailabilitySources {
  return {
    cabinetWorkingHours: WORKING_HOURS,
    cabinetExceptions: [],
    workIntervals: WORK_INTERVALS,
    leaveRequests: [],
    appointments: [],
    businessDate: BUSINESS_DATE,
    nowTime: NOW_TIME,
    ...overrides,
  };
}

function buildAppointment(overrides: Partial<AgendaAppointment>): AgendaAppointment {
  return {
    id: "apt-x",
    date: "2026-08-25",
    schedulingType: "exact",
    time: "10:00",
    durationMinutes: 30,
    patientId: "pat-1",
    patientName: "Test Patient",
    practitionerId: "pr-1",
    practitionerName: "Dr. Benali",
    service: "Consultation",
    status: "confirmed",
    ...overrides,
  };
}

describe("service eligibility", () => {
  it("marks an active service bookable", () => {
    expect(isServiceBookable(SERVICE)).toBe(true);
  });

  it("marks an inactive service not bookable", () => {
    expect(isServiceBookable(INACTIVE_SERVICE)).toBe(false);
  });

  it("getBookableServices excludes inactive services and sorts by name", () => {
    const services: CabinetService[] = [
      { ...SERVICE, id: "svc-2", name: "Séance de kinésithérapie" },
      { ...SERVICE, id: "svc-1", name: "Consultation" },
      INACTIVE_SERVICE,
    ];
    const result = getBookableServices(services);
    expect(result.map((s) => s.id)).toEqual(["svc-1", "svc-2"]);
  });
});

describe("getSchedulablePractitioners", () => {
  const practitioners: AgendaPractitioner[] = [
    { id: "pr-1", name: "Dr. Benali" },
    { id: "pr-2", name: "Dr. Amal" },
  ];

  it("includes an active practitioner with a linked practitionerId", () => {
    const members: TeamMember[] = [
      {
        id: "team-1",
        employeeNumber: "EMP-0001",
        firstName: "Youssef",
        lastName: "Benali",
        role: "practitioner",
        professionalTitle: "Médecin",
        status: "active",
        practitionerId: "pr-1",
      },
    ];
    const result = getSchedulablePractitioners(members, practitioners);
    expect(result).toEqual([{ teamMemberId: "team-1", practitionerId: "pr-1", name: "Dr. Benali", professionalTitle: "Médecin" }]);
  });

  it("excludes a practitioner-role member with no practitionerId (Othmane Zouiten case)", () => {
    const members: TeamMember[] = [
      { id: "team-7", employeeNumber: "EMP-0007", firstName: "Othmane", lastName: "Zouiten", role: "practitioner", status: "inactive" },
    ];
    expect(getSchedulablePractitioners(members, practitioners)).toEqual([]);
  });

  it("excludes an inactive practitioner even with a linked practitionerId", () => {
    const members: TeamMember[] = [
      { id: "team-9", employeeNumber: "EMP-0009", firstName: "X", lastName: "Y", role: "practitioner", status: "inactive", practitionerId: "pr-1" },
    ];
    expect(getSchedulablePractitioners(members, practitioners)).toEqual([]);
  });

  it("excludes a non-practitioner role", () => {
    const members: TeamMember[] = [
      { id: "team-3", employeeNumber: "EMP-0003", firstName: "Meryem", lastName: "Bakkali", role: "receptionist", status: "active" },
    ];
    expect(getSchedulablePractitioners(members, practitioners)).toEqual([]);
  });
});

describe("doesAppointmentBlockAvailability", () => {
  it("blocks every non-terminal status", () => {
    for (const status of ["requested", "to_confirm", "confirmed", "arrived", "waiting", "in_consultation", "rescheduled"] as const) {
      expect(doesAppointmentBlockAvailability(status)).toBe(true);
    }
  });

  it("does not block terminal statuses", () => {
    for (const status of ["completed", "cancelled_by_patient", "cancelled_by_practice", "no_show"] as const) {
      expect(doesAppointmentBlockAvailability(status)).toBe(false);
    }
  });
});

describe("intersectIntervals", () => {
  it("intersects cabinet and practitioner intervals (task's own worked example)", () => {
    const cabinet = [
      { startTime: "08:30", endTime: "12:30" },
      { startTime: "14:00", endTime: "18:00" },
    ];
    const practitioner = [
      { startTime: "09:00", endTime: "13:00" },
      { startTime: "14:00", endTime: "17:00" },
    ];
    expect(intersectIntervals(cabinet, practitioner)).toEqual([
      { startTime: "09:00", endTime: "12:30" },
      { startTime: "14:00", endTime: "17:00" },
    ]);
  });

  it("produces nothing for non-overlapping intervals", () => {
    expect(intersectIntervals([{ startTime: "08:00", endTime: "09:00" }], [{ startTime: "10:00", endTime: "11:00" }])).toEqual([]);
  });

  it("does not mutate its inputs", () => {
    const cabinet = [{ startTime: "08:30", endTime: "12:30" }];
    const practitioner = [{ startTime: "09:00", endTime: "13:00" }];
    const cabinetCopy = JSON.parse(JSON.stringify(cabinet));
    const practitionerCopy = JSON.parse(JSON.stringify(practitioner));
    intersectIntervals(cabinet, practitioner);
    expect(cabinet).toEqual(cabinetCopy);
    expect(practitioner).toEqual(practitionerCopy);
  });
});

describe("generateCandidateSlots", () => {
  it("fits back-to-back slots at the service duration when duration === step", () => {
    const slots = generateCandidateSlots([{ startTime: "09:00", endTime: "10:30" }], 30, 30);
    expect(slots.map((s) => s.startTime)).toEqual(["09:00", "09:30", "10:00"]);
  });

  it("never offers a slot whose duration does not fully fit", () => {
    const slots = generateCandidateSlots([{ startTime: "09:00", endTime: "09:45" }], 60, 30);
    expect(slots).toEqual([]);
  });

  it("never bridges two separate intervals (split-hours / lunch closure, task §17)", () => {
    const slots = generateCandidateSlots(
      [
        { startTime: "08:30", endTime: "12:30" },
        { startTime: "14:00", endTime: "18:00" },
      ],
      60,
      BOOKING_SLOT_STEP_MINUTES,
    );
    expect(slots.some((s) => s.startTime === "12:00")).toBe(false);
    expect(slots.some((s) => s.startTime === "11:30" && s.endTime === "12:30")).toBe(true);
  });
});

describe("isPastDate", () => {
  it("treats a date before business date as past", () => {
    expect(isPastDate("2026-08-23", BUSINESS_DATE)).toBe(true);
  });

  it("treats business date itself as not past", () => {
    expect(isPastDate(BUSINESS_DATE, BUSINESS_DATE)).toBe(false);
  });

  it("treats a future date as not past", () => {
    expect(isPastDate("2026-08-25", BUSINESS_DATE)).toBe(false);
  });
});

describe("computeOccupiedIntervals", () => {
  it("includes a blocking appointment", () => {
    const appointments = [buildAppointment({ date: "2026-08-25", time: "10:00", durationMinutes: 30, status: "confirmed" })];
    expect(computeOccupiedIntervals("2026-08-25", "pr-1", appointments)).toEqual([{ start: 600, end: 630 }]);
  });

  it("excludes a cancelled appointment", () => {
    const appointments = [buildAppointment({ date: "2026-08-25", status: "cancelled_by_patient" })];
    expect(computeOccupiedIntervals("2026-08-25", "pr-1", appointments)).toEqual([]);
  });

  it("excludes another practitioner's appointment", () => {
    const appointments = [buildAppointment({ date: "2026-08-25", practitionerId: "pr-2" })];
    expect(computeOccupiedIntervals("2026-08-25", "pr-1", appointments)).toEqual([]);
  });
});

describe("getDayAvailability", () => {
  it("returns real slots on a normal open day", () => {
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources());
    expect(result.isBookable).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots[0]).toMatchObject({ practitionerId: "pr-1", serviceId: "svc-1" });
  });

  it("produces deterministic ascending slot order", () => {
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources());
    const starts = result.slots.map((s) => s.startTime);
    expect(starts).toEqual([...starts].sort());
  });

  it("blocks a past date", () => {
    const result = getDayAvailability("2026-08-20", SERVICE, PRACTITIONER, buildSources());
    expect(result).toEqual({ date: "2026-08-20", isBookable: false, reason: "past_date", slots: [] });
  });

  it("excludes past time slots on the business date itself", () => {
    const result = getDayAvailability(BUSINESS_DATE, SERVICE, PRACTITIONER, buildSources({ nowTime: "11:00" }));
    expect(result.slots.every((s) => s.startTime >= "11:00")).toBe(true);
  });

  it("closes for a public holiday exception with reason 'holiday'", () => {
    const exceptions: CabinetCalendarException[] = [
      { id: "exc-1", date: "2026-08-25", type: "public_holiday", intervals: [], createdAt: BUSINESS_DATE, active: true },
    ];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ cabinetExceptions: exceptions }));
    expect(result).toEqual({ date: "2026-08-25", isBookable: false, reason: "holiday", slots: [] });
  });

  it("closes for an exceptional closure exception with reason 'cabinet_closed'", () => {
    const exceptions: CabinetCalendarException[] = [
      { id: "exc-2", date: "2026-08-25", type: "exceptional_closure", intervals: [], createdAt: BUSINESS_DATE, active: true },
    ];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ cabinetExceptions: exceptions }));
    expect(result.isBookable).toBe(false);
    expect(result.reason).toBe("cabinet_closed");
  });

  it("closes the cabinet's normal weekly closed day (Sunday)", () => {
    const result = getDayAvailability("2026-08-30", SERVICE, PRACTITIONER, buildSources());
    expect(result.isBookable).toBe(false);
    expect(result.reason).toBe("cabinet_closed");
  });

  it("opens exceptionally on a normally-closed Sunday", () => {
    const exceptions: CabinetCalendarException[] = [
      {
        id: "exc-3",
        date: "2026-08-30",
        type: "exceptional_opening",
        intervals: [{ startTime: "09:00", endTime: "13:00" }],
        createdAt: BUSINESS_DATE,
        active: true,
      },
    ];
    const workIntervals = [...WORK_INTERVALS, { teamMemberId: "team-1", weekday: "sunday", startTime: "09:00", endTime: "13:00", active: true }];
    const result = getDayAvailability(
      "2026-08-30",
      SERVICE,
      PRACTITIONER,
      buildSources({ cabinetExceptions: exceptions, workIntervals }),
    );
    expect(result.isBookable).toBe(true);
    expect(result.slots.length).toBeGreaterThan(0);
  });

  it("replaces (never unions) normal hours with modified-hours intervals", () => {
    const exceptions: CabinetCalendarException[] = [
      {
        id: "exc-4",
        date: "2026-08-25",
        type: "modified_hours",
        intervals: [{ startTime: "15:00", endTime: "16:00" }],
        createdAt: BUSINESS_DATE,
        active: true,
      },
    ];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ cabinetExceptions: exceptions }));
    expect(result.slots.every((s) => s.startTime >= "15:00" && s.endTime <= "16:00")).toBe(true);
    expect(result.slots.some((s) => s.startTime < "14:00")).toBe(false);
  });

  it("blocks when approved leave covers the date", () => {
    const leaveRequests: LeaveRequest[] = [
      {
        id: "lr-1",
        teamMemberId: "team-1",
        leaveType: "annual",
        startDate: "2026-08-25",
        endDate: "2026-08-25",
        duration: 1,
        status: "approved",
        requestedAt: "2026-08-01",
      },
    ];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ leaveRequests }));
    expect(result).toEqual({ date: "2026-08-25", isBookable: false, reason: "practitioner_on_leave", slots: [] });
  });

  it("ignores a pending leave request", () => {
    const leaveRequests: LeaveRequest[] = [
      {
        id: "lr-2",
        teamMemberId: "team-1",
        leaveType: "annual",
        startDate: "2026-08-25",
        endDate: "2026-08-25",
        duration: 1,
        status: "pending",
        requestedAt: "2026-08-01",
      },
    ];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ leaveRequests }));
    expect(result.isBookable).toBe(true);
  });

  it("ignores a rejected leave request", () => {
    const leaveRequests: LeaveRequest[] = [
      {
        id: "lr-3",
        teamMemberId: "team-1",
        leaveType: "annual",
        startDate: "2026-08-25",
        endDate: "2026-08-25",
        duration: 1,
        status: "rejected",
        requestedAt: "2026-08-01",
      },
    ];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ leaveRequests }));
    expect(result.isBookable).toBe(true);
  });

  it("reports practitioner_not_scheduled when the cabinet is open but the practitioner has no interval that weekday", () => {
    const workIntervals = WORK_INTERVALS.filter((interval) => interval.weekday !== "tuesday");
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ workIntervals }));
    expect(result).toEqual({ date: "2026-08-25", isBookable: false, reason: "practitioner_not_scheduled", slots: [] });
  });

  it("excludes a slot with an exact-overlap blocking appointment", () => {
    const appointments = [buildAppointment({ date: "2026-08-25", time: "09:00", durationMinutes: 30, status: "confirmed" })];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ appointments }));
    expect(result.slots.some((s) => s.startTime === "09:00")).toBe(false);
  });

  it("excludes a slot with a partial-overlap blocking appointment (task's own 10:00-10:30 vs 10:15-10:45 example)", () => {
    const appointments = [buildAppointment({ date: "2026-08-25", time: "10:00", durationMinutes: 30, status: "confirmed" })];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ appointments }));
    expect(result.slots.some((s) => s.startTime === "10:15")).toBe(false);
  });

  it("does not block on a cancelled appointment occupying the same time", () => {
    const appointments = [buildAppointment({ date: "2026-08-25", time: "09:00", durationMinutes: 30, status: "cancelled_by_patient" })];
    const result = getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, buildSources({ appointments }));
    expect(result.slots.some((s) => s.startTime === "09:00")).toBe(true);
  });

  it("reports fully_booked when every generated slot is occupied", () => {
    const shortHours: CabinetWorkingHoursDay[] = [{ weekday: "tuesday", isOpen: true, startTime: "09:00", endTime: "09:30" }];
    const shortWorkIntervals = [{ teamMemberId: "team-1", weekday: "tuesday", startTime: "09:00", endTime: "09:30", active: true }];
    const appointments = [buildAppointment({ date: "2026-08-25", time: "09:00", durationMinutes: 30, status: "confirmed" })];
    const result = getDayAvailability(
      "2026-08-25",
      SERVICE,
      PRACTITIONER,
      buildSources({ cabinetWorkingHours: shortHours, workIntervals: shortWorkIntervals, appointments }),
    );
    expect(result).toEqual({ date: "2026-08-25", isBookable: false, reason: "fully_booked", slots: [] });
  });

  it("does not mutate any of its source arrays", () => {
    const sources = buildSources();
    const snapshot = JSON.parse(JSON.stringify(sources));
    getDayAvailability("2026-08-25", SERVICE, PRACTITIONER, sources);
    expect(sources).toEqual(snapshot);
  });
});

describe("getMonthAvailability", () => {
  it("returns one entry per day of the month", () => {
    const result = getMonthAvailability(2026, 8, SERVICE, PRACTITIONER, buildSources());
    expect(result).toHaveLength(31);
    expect(result[0].date).toBe("2026-08-01");
    expect(result[30].date).toBe("2026-08-31");
  });

  it("marks the fixed weekly closed day as unavailable across the month", () => {
    const result = getMonthAvailability(2026, 8, SERVICE, PRACTITIONER, buildSources());
    const sundays = result.filter((day) => new Date(`${day.date}T00:00:00Z`).getUTCDay() === 0);
    expect(sundays.length).toBeGreaterThan(0);
    expect(sundays.every((day) => !day.isBookable)).toBe(true);
  });
});
