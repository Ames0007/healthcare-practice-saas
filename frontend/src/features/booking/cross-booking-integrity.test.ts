import { describe, expect, it } from "vitest";
import { getAgendaMockAppointments, MOCK_BUSINESS_DATE, MOCK_NOW_TIME, PRACTITIONERS } from "@/features/agenda/mock-data";
import { getCabinetCalendarExceptionsMockData } from "@/features/parametres/mock-calendar-exceptions-data";
import { getCabinetServicesMockData } from "@/features/parametres/mock-cabinet-services-data";
import { getCabinetWorkingHoursMockData } from "@/features/parametres/mock-cabinet-working-hours-data";
import { getLeaveRequestsMockData } from "@/features/team/mock-leave-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getWorkIntervalsMockData } from "@/features/team/mock-schedule-data";
import {
  type AvailabilitySources,
  computeOccupiedIntervals,
  getBookableServices,
  getDayAvailability,
  getSchedulablePractitioners,
} from "./availability";

/**
 * Cross-module reconciliation (UI-012ABCDE §58-63), mirroring every other
 * `cross-*-integrity.test.ts` in this codebase — proves the availability
 * engine's claims trace to Paramètres/Équipe/Agenda's own real, already-
 * shipped fixtures, never a second invented booking-availability universe
 * (task §5/§77).
 */
describe("cross-booking-integrity", () => {
  const services = getCabinetServicesMockData();
  const workingHours = getCabinetWorkingHoursMockData();
  const exceptions = getCabinetCalendarExceptionsMockData();
  const workIntervals = getWorkIntervalsMockData();
  const leaveRequests = getLeaveRequestsMockData();
  const teamMembers = getTeamMembersMockData();
  const appointments = getAgendaMockAppointments();

  const sources: AvailabilitySources = {
    cabinetWorkingHours: workingHours,
    cabinetExceptions: exceptions,
    workIntervals,
    leaveRequests,
    appointments,
    businessDate: MOCK_BUSINESS_DATE,
    nowTime: MOCK_NOW_TIME,
  };

  it("reconciles bookable services with Paramètres → Services: excludes exactly the one inactive service", () => {
    const bookable = getBookableServices(services);
    const inactive = services.filter((service) => !service.active);
    expect(inactive).toHaveLength(1);
    expect(bookable.some((service) => service.id === inactive[0].id)).toBe(false);
    expect(bookable).toHaveLength(services.length - 1);
  });

  it("reconciles schedulable practitioners with Équipe: exactly Dr. Benali and Dr. Amal, never Othmane Zouiten", () => {
    const practitioners = getSchedulablePractitioners(teamMembers, PRACTITIONERS);
    expect(practitioners.map((p) => p.practitionerId).sort()).toEqual(["pr-1", "pr-2"]);
    expect(practitioners.some((p) => p.teamMemberId === "team-7")).toBe(false);
  });

  it("reconciles cabinet hours: the real weekly-closed Sunday (2026-08-23, the business date itself — exception-free) produces zero slots", () => {
    const consultation = services.find((service) => service.id === "svc-1")!;
    const [benali] = getSchedulablePractitioners(teamMembers, PRACTITIONERS);
    expect(exceptions.some((exception) => exception.date === MOCK_BUSINESS_DATE)).toBe(false);

    const result = getDayAvailability(MOCK_BUSINESS_DATE, consultation, benali, sources);
    expect(result.isBookable).toBe(false);
    expect(result.reason).toBe("cabinet_closed");
  });

  it("reconciles calendar exceptions with practitioner schedules: the real exceptional opening on 2026-08-30 makes the cabinet open, but no real practitioner has a Sunday WorkInterval, so the engine correctly reports practitioner_not_scheduled rather than cabinet_closed", () => {
    const consultation = services.find((service) => service.id === "svc-1")!;
    const [benali] = getSchedulablePractitioners(teamMembers, PRACTITIONERS);
    const opening = exceptions.find((exception) => exception.type === "exceptional_opening")!;
    expect(opening.date).toBe("2026-08-30");
    expect(workIntervals.some((interval) => interval.teamMemberId === benali.teamMemberId && interval.weekday === "sunday")).toBe(false);

    const result = getDayAvailability(opening.date, consultation, benali, sources);
    expect(result.isBookable).toBe(false);
    expect(result.reason).toBe("practitioner_not_scheduled");
  });

  it("reconciles calendar exceptions: the real public holiday (2026-11-06) closes an otherwise-normal working Friday", () => {
    const consultation = services.find((service) => service.id === "svc-1")!;
    const [benali] = getSchedulablePractitioners(teamMembers, PRACTITIONERS);
    const holiday = exceptions.find((exception) => exception.type === "public_holiday" && exception.date === "2026-11-06")!;
    expect(holiday).toBeDefined();

    const result = getDayAvailability(holiday.date, consultation, benali, sources);
    expect(result.isBookable).toBe(false);
    expect(result.reason).toBe("holiday");
  });

  it("reconciles approved leave: Dr. Amal's real approved leave (2026-08-26 to 2026-08-28) blocks 2026-08-27", () => {
    const consultation = services.find((service) => service.id === "svc-1")!;
    const amal = getSchedulablePractitioners(teamMembers, PRACTITIONERS).find((p) => p.practitionerId === "pr-2")!;
    const approvedLeave = leaveRequests.find((request) => request.id === "lr-5")!;
    expect(approvedLeave.status).toBe("approved");
    expect(approvedLeave.teamMemberId).toBe(amal.teamMemberId);

    const result = getDayAvailability("2026-08-27", consultation, amal, sources);
    expect(result.isBookable).toBe(false);
    expect(result.reason).toBe("practitioner_on_leave");
  });

  it("reconciles occupancy with Agenda's real apt-12 (Dr. Benali, 2026-08-24, 09:30-10:15)", () => {
    const blocking = appointments.find((appointment) => appointment.id === "apt-12")!;
    expect(blocking.status).toBe("confirmed");
    expect(blocking.date).toBe("2026-08-24");

    const occupied = computeOccupiedIntervals("2026-08-24", "pr-1", appointments);
    expect(occupied).toEqual([{ start: 9 * 60 + 30, end: 10 * 60 + 15 }]);
  });

  it("on a real exception-free, appointment-free working day (2026-08-25), both morning and afternoon effective intervals produce slots", () => {
    const consultation = services.find((service) => service.id === "svc-1")!;
    const benali = getSchedulablePractitioners(teamMembers, PRACTITIONERS).find((p) => p.practitionerId === "pr-1")!;
    expect(exceptions.some((exception) => exception.date === "2026-08-25")).toBe(false);
    expect(appointments.some((appointment) => appointment.date === "2026-08-25")).toBe(false);

    const result = getDayAvailability("2026-08-25", consultation, benali, sources);
    expect(result.isBookable).toBe(true);
    expect(result.slots.some((slot) => slot.startTime === "08:30")).toBe(true);
    expect(result.slots.some((slot) => slot.startTime === "14:30")).toBe(true);
  });

  it("reconciles calendar exceptions with real appointments: the real modified-hours exception on 2026-08-24 (the same date as apt-12/apt-13) reduces slots to the afternoon-only window", () => {
    const consultation = services.find((service) => service.id === "svc-1")!;
    const benali = getSchedulablePractitioners(teamMembers, PRACTITIONERS).find((p) => p.practitionerId === "pr-1")!;
    const modifiedHours = exceptions.find((exception) => exception.type === "modified_hours" && exception.date === "2026-08-24")!;
    expect(modifiedHours).toBeDefined();

    const result = getDayAvailability("2026-08-24", consultation, benali, sources);
    expect(result.isBookable).toBe(true);
    expect(result.slots.every((slot) => slot.startTime >= "14:30")).toBe(true);
  });

  it("never mutates any real source fixture array while resolving availability", () => {
    const consultation = services.find((service) => service.id === "svc-1")!;
    const [benali] = getSchedulablePractitioners(teamMembers, PRACTITIONERS);
    const snapshot = JSON.parse(JSON.stringify({ services, workingHours, exceptions, workIntervals, leaveRequests, appointments }));

    getDayAvailability("2026-08-24", consultation, benali, sources);

    expect({ services, workingHours, exceptions, workIntervals, leaveRequests, appointments }).toEqual(snapshot);
  });
});
