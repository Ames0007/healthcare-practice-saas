import type { Locale } from "@/i18n/config";
import { toIntlLocale } from "@/i18n/intl-locale";
import type { AgendaAppointment } from "@/features/agenda/types";
import { parseTimeToMinutes } from "@/features/agenda/format";
import { getWeekdayFromIso, intervalsAreSequential, isValidWorkInterval } from "@/features/team/schedule";
import { CALENDAR_EXCEPTION_TYPE_MAP } from "@/components/domain/settings/calendar-exception-type";
import type {
  CabinetCalendarException,
  CabinetWorkingHoursDay,
  CalendarExceptionFormValues,
  CalendarExceptionInterval,
  CalendarExceptionType,
} from "@/components/domain/settings/types";

const TERMINAL_APPOINTMENT_STATUSES = new Set(["completed", "cancelled_by_patient", "cancelled_by_practice", "no_show"]);

export function isClosedExceptionType(type: CalendarExceptionType): boolean {
  return CALENDAR_EXCEPTION_TYPE_MAP[type].isClosed;
}

/** A date strictly before the prototype's own fixed "today" is past — history, read-only (task §20). "Today" itself remains editable. */
export function isPastException(date: string, businessDate: string): boolean {
  return date < businessDate;
}

export function sortExceptionsByDate(exceptions: CabinetCalendarException[]): CabinetCalendarException[] {
  return [...exceptions].sort((a, b) => a.date.localeCompare(b.date));
}

/** "novembre 2026" — no existing shared formatter covers month+year only (`formatDayMonth`/`formatDayMonthYear` always include the day). */
export function formatMonthYear(isoDate: string, locale: Locale): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(toIntlLocale(locale), { month: "long", year: "numeric", calendar: "gregory" }).format(date);
}

export interface CalendarExceptionMonthGroup {
  monthKey: string;
  monthLabel: string;
  exceptions: CabinetCalendarException[];
}

/** Chronological month groups (task §12's own "NOVEMBRE 2026" wireframe) — never fixture insertion order. */
export function groupExceptionsByMonth(exceptions: CabinetCalendarException[], locale: Locale): CalendarExceptionMonthGroup[] {
  const sorted = sortExceptionsByDate(exceptions);
  const groups: CalendarExceptionMonthGroup[] = [];

  for (const exception of sorted) {
    const monthKey = exception.date.slice(0, 7);
    const lastGroup = groups.at(-1);
    if (lastGroup && lastGroup.monthKey === monthKey) {
      lastGroup.exceptions.push(exception);
    } else {
      groups.push({ monthKey, monthLabel: formatMonthYear(exception.date, locale), exceptions: [exception] });
    }
  }

  return groups;
}

/** V1 duplicate-date policy (task §10): at most one active exception per date — editing replaces it, never stacks a second one. */
export function hasActiveExceptionForDate(exceptions: CabinetCalendarException[], date: string, excludeId?: string): boolean {
  return exceptions.some((exception) => exception.active && exception.date === date && exception.id !== excludeId);
}

/** Every interval individually valid (start < end) and, sorted by start time, mutually non-overlapping (reuses `isValidWorkInterval`/`intervalsAreSequential` — Équipe's own rule, never a second time-validity check, task §14). */
export function areIntervalsValid(intervals: CalendarExceptionInterval[]): boolean {
  if (intervals.length === 0) return false;
  if (!intervals.every((interval) => isValidWorkInterval(interval.startTime, interval.endTime))) return false;

  const sorted = [...intervals].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  for (let i = 1; i < sorted.length; i += 1) {
    if (!intervalsAreSequential(sorted[i - 1].endTime, sorted[i].startTime)) return false;
  }
  return true;
}

export interface CalendarExceptionFormErrors {
  date?: string;
  intervals?: string;
  duplicate?: string;
}

export interface CalendarExceptionFormMessages {
  dateRequired: string;
  intervalsRequired: string;
  intervalsInvalid: string;
  duplicateDate: string;
}

/** Centralized form validation (task §5-10/§14) — closed types never require intervals; open types always require at least one valid, non-overlapping interval; at most one active exception per date. */
export function validateCalendarExceptionForm(
  values: CalendarExceptionFormValues,
  exceptions: CabinetCalendarException[],
  excludeId: string | undefined,
  messages: CalendarExceptionFormMessages,
): CalendarExceptionFormErrors {
  const errors: CalendarExceptionFormErrors = {};

  if (!values.date) {
    errors.date = messages.dateRequired;
  } else if (hasActiveExceptionForDate(exceptions, values.date, excludeId)) {
    errors.duplicate = messages.duplicateDate;
  }

  if (!isClosedExceptionType(values.type)) {
    if (values.intervals.length === 0) {
      errors.intervals = messages.intervalsRequired;
    } else if (!areIntervalsValid(values.intervals)) {
      errors.intervals = messages.intervalsInvalid;
    }
  }

  return errors;
}

/** Closed types always persist an empty `intervals` array, regardless of any stale form state (never `00:00–00:00`, task §6). */
export function buildCalendarExceptionFromFormValues(
  values: CalendarExceptionFormValues,
  id: string,
  createdAt: string,
): CabinetCalendarException {
  return {
    id,
    date: values.date,
    type: values.type,
    reason: values.reason.trim() || undefined,
    intervals: isClosedExceptionType(values.type) ? [] : values.intervals,
    createdAt,
    active: true,
  };
}

export function buildInitialCalendarExceptionFormValues(
  existing?: CabinetCalendarException,
): CalendarExceptionFormValues {
  if (!existing) {
    return { date: "", type: "public_holiday", reason: "", intervals: [] };
  }
  return {
    date: existing.date,
    type: existing.type,
    reason: existing.reason ?? "",
    intervals: existing.intervals,
  };
}

export interface EffectiveCabinetAvailability {
  date: string;
  isOpen: boolean;
  intervals: CalendarExceptionInterval[];
  source: "weekly_schedule" | "calendar_exception";
  exceptionType?: CalendarExceptionType;
  reason?: string;
}

/**
 * The single centralized pure resolver (task §9) every consumer reads —
 * never re-implemented inline in JSX. An active exception for the date
 * always wins outright over the weekly schedule (task §7: "the date
 * exception wins", not a union); with no exception, the weekday's own
 * `CabinetWorkingHoursDay` applies unchanged.
 */
export function resolveEffectiveCabinetAvailability(
  date: string,
  workingHours: CabinetWorkingHoursDay[],
  exceptions: CabinetCalendarException[],
): EffectiveCabinetAvailability {
  const exception = exceptions.find((candidate) => candidate.active && candidate.date === date);

  if (exception) {
    const closed = isClosedExceptionType(exception.type);
    return {
      date,
      isOpen: !closed,
      intervals: closed ? [] : exception.intervals,
      source: "calendar_exception",
      exceptionType: exception.type,
      reason: exception.reason,
    };
  }

  const weekday = getWeekdayFromIso(date);
  const day = workingHours.find((candidate) => candidate.weekday === weekday);

  if (!day || !day.isOpen || !day.startTime || !day.endTime) {
    return { date, isOpen: false, intervals: [], source: "weekly_schedule" };
  }

  return {
    date,
    isOpen: true,
    intervals: [{ startTime: day.startTime, endTime: day.endTime }],
    source: "weekly_schedule",
  };
}

/**
 * Real (never fabricated) appointment-conflict detection (task §22-24) —
 * a non-terminal appointment on `date` that falls outside every effective
 * interval (or every appointment, if the effective result is fully
 * closed). Never mutates/cancels/reschedules anything — read-only
 * detection so the UI can show a warning, per the task's own explicit
 * "do not silently delete/reschedule them."
 */
export function findConflictingAppointments(
  date: string,
  availability: EffectiveCabinetAvailability,
  appointments: AgendaAppointment[],
): AgendaAppointment[] {
  const sameDayActive = appointments.filter(
    (appointment) => appointment.date === date && !TERMINAL_APPOINTMENT_STATUSES.has(appointment.status),
  );

  if (!availability.isOpen) {
    return sameDayActive;
  }

  return sameDayActive.filter((appointment) => {
    const start = parseTimeToMinutes(appointment.time);
    const end = appointment.endTime
      ? parseTimeToMinutes(appointment.endTime)
      : start + (appointment.durationMinutes ?? 30);

    return !availability.intervals.some((interval) => {
      const intervalStart = parseTimeToMinutes(interval.startTime);
      const intervalEnd = parseTimeToMinutes(interval.endTime);
      return start >= intervalStart && end <= intervalEnd;
    });
  });
}
