import type { Locale } from "@/i18n/config";
import { addDaysIso, getWeekDates, getWeekStart } from "@/features/agenda/format";
import { formatDayMonth } from "@/features/patients/format";
import { formatMonthYear, resolveEffectiveCabinetAvailability } from "@/features/parametres/calendar-exceptions";
import type { CabinetCalendarException, CabinetWorkingHoursDay, CalendarExceptionType } from "@/components/domain/settings/types";
import type { LeaveRequest, LeaveRequestStatus, LeaveType, TeamMember } from "@/components/domain/team/types";
import { getTeamMemberFullName } from "./format";

export { formatMonthYear };

/**
 * Read-only calendar projection of a `LeaveRequest` (task §5/§6) — never a
 * second authoritative leave record. Every value is derived from the
 * existing `LeaveRequest`/`TeamMember` sources at render time; nothing here
 * is ever written back. `isPractitioner`/`reason` extend the task's own
 * suggested field list since the practitioner-overlap indicator (§24) and
 * the event detail drawer's "Motif" (§19) both need them, and re-deriving
 * either from the source `LeaveRequest[]` a second time at call sites would
 * only invite drift.
 */
export interface LeaveCalendarEvent {
  leaveRequestId: string;
  teamMemberId: string;
  employeeName: string;
  employeeNumber: string;
  isPractitioner: boolean;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  duration: number;
  status: LeaveRequestStatus;
  reason?: string;
}

/** Projects every `LeaveRequest` into a `LeaveCalendarEvent` — a request whose `teamMemberId` does not resolve is skipped defensively, never thrown. */
export function buildLeaveCalendarEvents(requests: LeaveRequest[], members: TeamMember[]): LeaveCalendarEvent[] {
  const memberById = new Map(members.map((member) => [member.id, member]));

  return requests.flatMap((request) => {
    const member = memberById.get(request.teamMemberId);
    if (!member) return [];

    const event: LeaveCalendarEvent = {
      leaveRequestId: request.id,
      teamMemberId: member.id,
      employeeName: getTeamMemberFullName(member),
      employeeNumber: member.employeeNumber,
      isPractitioner: member.role === "practitioner",
      leaveType: request.leaveType,
      startDate: request.startDate,
      endDate: request.endDate,
      duration: request.duration,
      status: request.status,
      reason: request.reason,
    };
    return [event];
  });
}

/** Inclusive range coverage (task §9): `date >= startDate && date <= endDate` — a multi-day event covers every date in between, not only its start date. */
export function doesEventCoverDate(event: LeaveCalendarEvent, date: string): boolean {
  return date >= event.startDate && date <= event.endDate;
}

export function getEventsForDate(
  events: LeaveCalendarEvent[],
  date: string,
  statuses?: LeaveRequestStatus[],
): LeaveCalendarEvent[] {
  return events.filter((event) => doesEventCoverDate(event, date) && (!statuses || statuses.includes(event.status)));
}

/** Confirmed absence only (task §22): pending/rejected never count, regardless of the page's own display filters. */
export function getApprovedTeamMembersAway(events: LeaveCalendarEvent[], date: string): LeaveCalendarEvent[] {
  return getEventsForDate(events, date, ["approved"]);
}

/** Practitioner-overlap derivation (task §24) — `TeamRole === "practitioner"`, the cabinet-employment relationship. Deliberately not `practitionerId` (Agenda's *schedulable* link, used only for commission eligibility, UI-007CDEF Gate 4) — an inactive or not-yet-linked practitioner is still a practitioner for absence-visibility purposes. */
export function countApprovedPractitionersAway(events: LeaveCalendarEvent[], date: string): number {
  return getApprovedTeamMembersAway(events, date).filter((event) => event.isPractitioner).length;
}

/**
 * The 5 statuses a "Statut" filter can resolve to (task §16) — `undefined`
 * means no status filtering at all. The default, restrained operational
 * view is `"operational"` (Approuvé + En attente): a rejected request is
 * still reachable, just not shown by default, matching the task's own
 * "should not normally clutter... may be accessible through the Status
 * filter if useful" instruction.
 */
export type LeaveCalendarStatusFilter = "operational" | "approved" | "pending" | "rejected" | "all";

export function resolveStatusFilterValues(filter: LeaveCalendarStatusFilter): LeaveRequestStatus[] | undefined {
  switch (filter) {
    case "operational":
      return ["approved", "pending"];
    case "approved":
      return ["approved"];
    case "pending":
      return ["pending"];
    case "rejected":
      return ["rejected"];
    case "all":
      return undefined;
  }
}

export function getMonthStartIso(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

export function getMonthEndIso(monthStartIso: string): string {
  const [year, month] = monthStartIso.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

/** Whole calendar months only (never a fixed day-count) — safe for both Month/Year navigation and 28-31-day months alike. */
export function shiftMonthIso(monthStartIso: string, deltaMonths: number): string {
  const [year, month] = monthStartIso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + deltaMonths, 1)).toISOString().slice(0, 10);
}

/** Always 42 dates (6 full weeks) starting on the Monday of the week containing the 1st — enough to cover any month regardless of where it starts (task §13: deterministic, never system-date-dependent). */
export function buildMonthGridDates(monthStartIso: string): string[] {
  const gridStart = getWeekStart(monthStartIso);
  return Array.from({ length: 42 }, (_, index) => addDaysIso(gridStart, index));
}

export interface LeaveCalendarMonthDay {
  date: string;
  isCurrentMonth: boolean;
  events: LeaveCalendarEvent[];
}

/** Month-grid projection (task §8/§10) — every date in the visible 6-week grid, each carrying only the events that actually cover it (multi-day events repeat across every date they span, never only their start date). */
export function buildLeaveCalendarMonth(
  monthStartIso: string,
  events: LeaveCalendarEvent[],
  statuses?: LeaveRequestStatus[],
): LeaveCalendarMonthDay[] {
  const monthKey = monthStartIso.slice(0, 7);

  return buildMonthGridDates(monthStartIso).map((date) => ({
    date,
    isCurrentMonth: date.slice(0, 7) === monthKey,
    events: getEventsForDate(events, date, statuses),
  }));
}

/** Whole-cabinet count, always business-date-anchored, never scoped to the currently browsed period (task §30 dashboard metric). */
export function countApprovedLeaveTouchingMonth(events: LeaveCalendarEvent[], monthStartIso: string): number {
  const monthEnd = getMonthEndIso(monthStartIso);
  return events.filter(
    (event) => event.status === "approved" && event.startDate <= monthEnd && event.endDate >= monthStartIso,
  ).length;
}

export function countPendingRequests(events: LeaveCalendarEvent[]): number {
  return events.filter((event) => event.status === "pending").length;
}

export interface CabinetClosureInfo {
  exceptionType: CalendarExceptionType;
  reason?: string;
}

/**
 * Cabinet-level closure context (task §26) — reuses
 * `resolveEffectiveCabinetAvailability` outright, never reimplemented.
 * Cabinet closure stays a distinct concept from employee leave (task §26:
 * "keep Cabinet closure != Employee leave") — this never returns a
 * `LeaveCalendarEvent` and a holiday is never converted into per-employee
 * leave requests. Only a genuine calendar EXCEPTION (public holiday,
 * exceptional closure, rest day) is surfaced; an ordinary non-working
 * weekday from the recurring weekly schedule (e.g. every Sunday) is not
 * "CABINET FERMÉ" noise, so it is deliberately excluded
 * (`source !== "calendar_exception"`).
 */
export function getCabinetClosureForDate(
  date: string,
  workingHours: CabinetWorkingHoursDay[],
  exceptions: CabinetCalendarException[],
): CabinetClosureInfo | null {
  const availability = resolveEffectiveCabinetAvailability(date, workingHours, exceptions);
  if (availability.isOpen || availability.source !== "calendar_exception" || !availability.exceptionType) {
    return null;
  }
  return { exceptionType: availability.exceptionType, reason: availability.reason };
}

export { addDaysIso, getWeekDates, getWeekStart };

/** "01 septembre" (single day) or "01 septembre – 03 septembre" (multi-day) — List view's own compact range label (task §12). */
export function formatEventDateRange(event: LeaveCalendarEvent, locale: Locale): string {
  if (event.startDate === event.endDate) return formatDayMonth(event.startDate, locale);
  return `${formatDayMonth(event.startDate, locale)} – ${formatDayMonth(event.endDate, locale)}`;
}

export interface LeaveCalendarMonthGroup {
  monthKey: string;
  monthLabel: string;
  events: LeaveCalendarEvent[];
}

/** List-view grouping (task §12), chronological by start date — never fixture insertion order (mirrors `groupExceptionsByMonth`'s exact pattern, UI-AGENDA-X). */
export function groupLeaveEventsByMonth(events: LeaveCalendarEvent[], locale: Locale): LeaveCalendarMonthGroup[] {
  const sorted = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const groups: LeaveCalendarMonthGroup[] = [];

  for (const event of sorted) {
    const monthKey = event.startDate.slice(0, 7);
    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup.monthKey === monthKey) {
      lastGroup.events.push(event);
    } else {
      groups.push({ monthKey, monthLabel: formatMonthYear(event.startDate, locale), events: [event] });
    }
  }

  return groups;
}
