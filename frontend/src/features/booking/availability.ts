import type { CabinetCalendarException, CabinetService, CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import type { LeaveRequest, TeamMember } from "@/components/domain/team/types";
import type { AgendaAppointment, AgendaPractitioner } from "@/features/agenda/types";
import { addMinutesToTime, parseTimeToMinutes } from "@/features/agenda/format";
import { overlaps, TERMINAL_STATUSES, toRange, type TimeRange } from "@/features/agenda/conflict";
import { resolveEffectiveCabinetAvailability } from "@/features/parametres/calendar-exceptions";
import { sortServicesByName } from "@/features/parametres/services";
import { doesApprovedLeaveCoverDate } from "@/features/team/leave";
import { getWeekdayFromIso } from "@/features/team/schedule";
import type { BookableSlot, DayAvailability, Interval, SchedulablePractitioner, UnavailableReason } from "./types";

/**
 * No slot-granularity rule is defined by any approved specification or
 * existing `AppointmentSettings` field (task §16 — "record it explicitly
 * in DECISIONS.md" when absent). 30 minutes reuses the one real,
 * already-shipped precedent in this exact problem space: Agenda's own
 * day-view grid (`features/agenda/components/day-view.tsx`'s
 * `SLOT_MINUTES = 30`) and its conflict-suggestion stepping
 * (`features/agenda/conflict.ts`'s `suggestAlternativeTimes`, `+= 30`).
 * See ADR-017.
 */
export const BOOKING_SLOT_STEP_MINUTES = 30;

/** Task §7 — active only; no per-service practitioner-eligibility data exists anywhere in `CabinetService` (see `getSchedulablePractitioners`'s own doc comment), so no further filtering applies here. */
export function isServiceBookable(service: CabinetService): boolean {
  return service.active;
}

export function getBookableServices(services: CabinetService[]): CabinetService[] {
  return sortServicesByName(services.filter(isServiceBookable));
}

/**
 * Task §30 — "must use the canonical schedulable practitioner relationship
 * established by Agenda", explicitly NOT `role === "practitioner"` alone
 * (`TeamMember.practitionerId`'s own doc comment names exactly this case:
 * Othmane Zouiten, `team-7`, is a practitioner with no `practitionerId`
 * link and must never appear here). `CabinetService` carries no
 * per-practitioner eligibility field, so every schedulable practitioner is
 * eligible for every active service (task §7's "if practitioner
 * relationships exist" — none do).
 */
export function getSchedulablePractitioners(
  teamMembers: TeamMember[],
  practitioners: AgendaPractitioner[],
): SchedulablePractitioner[] {
  const practitionerById = new Map(practitioners.map((practitioner) => [practitioner.id, practitioner]));

  return teamMembers
    .filter((member) => member.role === "practitioner" && member.status === "active" && member.practitionerId)
    .map((member): SchedulablePractitioner | null => {
      const practitioner = practitionerById.get(member.practitionerId as string);
      if (!practitioner) return null;
      return {
        teamMemberId: member.id,
        practitionerId: practitioner.id,
        name: practitioner.name,
        professionalTitle: member.professionalTitle,
      };
    })
    .filter((value): value is SchedulablePractitioner => value !== null);
}

/**
 * Reuses `TERMINAL_STATUSES` from `features/agenda/conflict.ts` verbatim
 * (task §13: "Do NOT invent status semantics if already defined") — the
 * exact same set already used twice in this codebase (Agenda's own
 * conflict detection, Paramètres' calendar-exception conflict detection).
 * `rescheduled` deliberately still blocks: neither existing precedent
 * treats it as terminal.
 */
export function doesAppointmentBlockAvailability(status: AgendaAppointment["status"]): boolean {
  return !TERMINAL_STATUSES.has(status);
}

function minutesToTime(minutes: number): string {
  return addMinutesToTime("00:00", minutes);
}

/** The one centralized pure interval-intersection helper (task §10). */
export function intersectIntervals(first: Interval[], second: Interval[]): Interval[] {
  const result: Interval[] = [];

  for (const a of first) {
    for (const b of second) {
      const start = Math.max(parseTimeToMinutes(a.startTime), parseTimeToMinutes(b.startTime));
      const end = Math.min(parseTimeToMinutes(a.endTime), parseTimeToMinutes(b.endTime));
      if (start < end) {
        result.push({ startTime: minutesToTime(start), endTime: minutesToTime(end) });
      }
    }
  }

  return result.sort((x, y) => parseTimeToMinutes(x.startTime) - parseTimeToMinutes(y.startTime));
}

/** That weekday's own active intervals for one team member (Équipe's `WorkInterval[]`), sorted earliest-first. */
export function getPractitionerIntervalsForDate(
  date: string,
  workIntervals: { teamMemberId: string; weekday: string; startTime: string; endTime: string; active: boolean }[],
  teamMemberId: string,
): Interval[] {
  const weekday = getWeekdayFromIso(date);

  return workIntervals
    .filter((interval) => interval.teamMemberId === teamMemberId && interval.weekday === weekday && interval.active)
    .map((interval) => ({ startTime: interval.startTime, endTime: interval.endTime }))
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
}

/**
 * Candidate start times fully contained within one interval (task §15/§17)
 * — each effective interval is walked independently, so a split-hours gap
 * (lunch closure) never produces a crossing slot by construction: nothing
 * bridges two separate `Interval` entries.
 */
function generateSlotsWithinInterval(interval: Interval, durationMinutes: number, stepMinutes: number): Interval[] {
  const slots: Interval[] = [];
  const intervalEndMinutes = parseTimeToMinutes(interval.endTime);
  let startMinutes = parseTimeToMinutes(interval.startTime);

  while (startMinutes + durationMinutes <= intervalEndMinutes) {
    slots.push({ startTime: minutesToTime(startMinutes), endTime: minutesToTime(startMinutes + durationMinutes) });
    startMinutes += stepMinutes;
  }

  return slots;
}

export function generateCandidateSlots(
  intervals: Interval[],
  durationMinutes: number,
  stepMinutes: number = BOOKING_SLOT_STEP_MINUTES,
): Interval[] {
  return intervals.flatMap((interval) => generateSlotsWithinInterval(interval, durationMinutes, stepMinutes));
}

export function isPastDate(date: string, businessDate: string): boolean {
  return date < businessDate;
}

/** Task §20 — past dates are excluded by the caller before this ever runs; same-day past times are excluded here against the deterministic prototype "now". */
function excludePastSlotsToday(slots: Interval[], date: string, businessDate: string, nowTime: string): Interval[] {
  if (date !== businessDate) return slots;
  return slots.filter((slot) => parseTimeToMinutes(slot.startTime) >= parseTimeToMinutes(nowTime));
}

/** Task §13/§14 — reuses Agenda's own `toRange`/`overlaps` (interval overlap, not exact-start equality) rather than a third re-implementation. */
export function computeOccupiedIntervals(
  date: string,
  practitionerId: string,
  appointments: AgendaAppointment[],
): TimeRange[] {
  return appointments
    .filter(
      (appointment) =>
        appointment.date === date &&
        appointment.practitionerId === practitionerId &&
        doesAppointmentBlockAvailability(appointment.status),
    )
    .map((appointment) => toRange(appointment));
}

function isSlotFree(slot: Interval, occupied: TimeRange[]): boolean {
  const slotRange = toRange({
    schedulingType: "exact",
    time: slot.startTime,
    durationMinutes: parseTimeToMinutes(slot.endTime) - parseTimeToMinutes(slot.startTime),
  });
  return !occupied.some((range) => overlaps(slotRange, range));
}

/** Every real, existing source this engine reads — never a second fixture universe (task §5/§77). */
export interface AvailabilitySources {
  cabinetWorkingHours: CabinetWorkingHoursDay[];
  cabinetExceptions: CabinetCalendarException[];
  workIntervals: { teamMemberId: string; weekday: string; startTime: string; endTime: string; active: boolean }[];
  leaveRequests: LeaveRequest[];
  appointments: AgendaAppointment[];
  /** The prototype's fixed deterministic "today" (never `new Date()`, mirrors `MOCK_BUSINESS_DATE`). */
  businessDate: string;
  /** The prototype's fixed deterministic "now" on `businessDate` (mirrors `MOCK_NOW_TIME`). */
  nowTime: string;
}

/**
 * The Gate 1 orchestration function every UI surface reads (task §6/§21) —
 * never re-implemented inline in a component. Resolution order: past date
 * -> cabinet closure/holiday -> approved leave -> practitioner not
 * scheduled that weekday -> generate+filter slots -> fully booked.
 */
export function getDayAvailability(
  date: string,
  service: CabinetService,
  practitioner: SchedulablePractitioner,
  sources: AvailabilitySources,
): DayAvailability {
  if (isPastDate(date, sources.businessDate)) {
    return { date, isBookable: false, reason: "past_date", slots: [] };
  }

  const cabinetAvailability = resolveEffectiveCabinetAvailability(date, sources.cabinetWorkingHours, sources.cabinetExceptions);
  if (!cabinetAvailability.isOpen) {
    const reason: UnavailableReason = cabinetAvailability.exceptionType === "public_holiday" ? "holiday" : "cabinet_closed";
    return { date, isBookable: false, reason, slots: [] };
  }

  if (doesApprovedLeaveCoverDate(sources.leaveRequests, practitioner.teamMemberId, date)) {
    return { date, isBookable: false, reason: "practitioner_on_leave", slots: [] };
  }

  const practitionerIntervals = getPractitionerIntervalsForDate(date, sources.workIntervals, practitioner.teamMemberId);
  const effectiveIntervals = intersectIntervals(cabinetAvailability.intervals, practitionerIntervals);
  if (effectiveIntervals.length === 0) {
    return { date, isBookable: false, reason: "practitioner_not_scheduled", slots: [] };
  }

  const candidates = generateCandidateSlots(effectiveIntervals, service.durationMinutes);
  const notPast = excludePastSlotsToday(candidates, date, sources.businessDate, sources.nowTime);
  const occupied = computeOccupiedIntervals(date, practitioner.practitionerId, sources.appointments);
  const free = notPast.filter((slot) => isSlotFree(slot, occupied));

  if (free.length === 0) {
    return { date, isBookable: false, reason: "fully_booked", slots: [] };
  }

  const slots: BookableSlot[] = free
    .map((slot) => ({ ...slot, practitionerId: practitioner.practitionerId, serviceId: service.id }))
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  return { date, isBookable: true, slots };
}

/**
 * One calendar month's per-day availability for a fixed service+
 * practitioner (feeds the public availability calendar, task §19/§33) —
 * every day computed through the exact same `getDayAvailability`, never a
 * separate lighter-weight "is this day open" check that could disagree
 * with the real slot list.
 */
export function getMonthAvailability(
  year: number,
  month: number,
  service: CabinetService,
  practitioner: SchedulablePractitioner,
  sources: AvailabilitySources,
): DayAvailability[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return getDayAvailability(date, service, practitioner, sources);
  });
}
