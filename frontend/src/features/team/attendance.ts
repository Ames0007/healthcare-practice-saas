import type { AttendanceRecord, AttendanceStatus, WorkInterval } from "@/components/domain/team/types";
import { parseTimeToMinutes } from "@/features/agenda/format";
import { getIntervalsForMember, getWeekdayFromIso } from "./schedule";

export function getAttendanceForMember(records: AttendanceRecord[], teamMemberId: string): AttendanceRecord[] {
  return records.filter((record) => record.teamMemberId === teamMemberId).sort((a, b) => b.businessDate.localeCompare(a.businessDate));
}

export function getAttendanceForDate(records: AttendanceRecord[], teamMemberId: string, businessDate: string): AttendanceRecord | null {
  return records.find((record) => record.teamMemberId === teamMemberId && record.businessDate === businessDate) ?? null;
}

/** ISO `yyyy-mm-dd` strings compare correctly with plain string comparison. */
export function isBusinessDateInPast(businessDate: string, todayIso: string): boolean {
  return businessDate < todayIso;
}

/** This member's own expected intervals for one calendar date, resolved via `WorkInterval` (PLANNING) — never a second hardcoded schedule (UI-007CDEF §15). */
export function getExpectedIntervalsForDate(workIntervals: WorkInterval[], teamMemberId: string, businessDate: string): WorkInterval[] {
  const weekday = getWeekdayFromIso(businessDate);
  return getIntervalsForMember(workIntervals, teamMemberId)
    .filter((interval) => interval.weekday === weekday)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
}

export function computeExpectedMinutes(expectedIntervals: WorkInterval[]): number {
  return expectedIntervals.reduce((sum, interval) => sum + (parseTimeToMinutes(interval.endTime) - parseTimeToMinutes(interval.startTime)), 0);
}

/**
 * Actual worked duration (§18-19) — the raw check-in/check-out span minus
 * any *unpaid gap* between consecutive expected intervals that the span
 * covers (e.g. a lunch break on a split-shift day), so this never simply
 * subtracts first-start from final-end and silently counts a non-working
 * gap as worked time (§18's own explicit warning).
 */
export function computeWorkedMinutes(checkIn: string, checkOut: string, expectedIntervals: WorkInterval[]): number {
  const start = parseTimeToMinutes(checkIn);
  const end = parseTimeToMinutes(checkOut);
  if (end <= start) return 0;

  let unpaidGapMinutes = 0;
  for (let i = 1; i < expectedIntervals.length; i += 1) {
    const gapStart = parseTimeToMinutes(expectedIntervals[i - 1].endTime);
    const gapEnd = parseTimeToMinutes(expectedIntervals[i].startTime);
    const overlapStart = Math.max(start, gapStart);
    const overlapEnd = Math.min(end, gapEnd);
    if (overlapEnd > overlapStart) {
      unpaidGapMinutes += overlapEnd - overlapStart;
    }
  }

  return end - start - unpaidGapMinutes;
}

/** Minutes late relative to the first expected interval's own start (§17) — 0 when on time or early. */
export function computeLateMinutes(checkIn: string, expectedIntervals: WorkInterval[]): number {
  if (expectedIntervals.length === 0) return 0;
  const expectedStart = parseTimeToMinutes(expectedIntervals[0].startTime);
  return Math.max(0, parseTimeToMinutes(checkIn) - expectedStart);
}

/** Minutes left before the last expected interval's own end (§20) — 0 when the member stayed until or past the expected end. */
export function computeEarlyDepartureMinutes(checkOut: string, expectedIntervals: WorkInterval[]): number {
  if (expectedIntervals.length === 0) return 0;
  const expectedEnd = parseTimeToMinutes(expectedIntervals[expectedIntervals.length - 1].endTime);
  return Math.max(0, expectedEnd - parseTimeToMinutes(checkOut));
}

/** Worked time beyond the total expected duration (§21) — operational duration only, never multiplied by any rate here (Gate 3's own boundary). */
export function computeOvertimeMinutes(workedMinutes: number, expectedMinutes: number): number {
  return Math.max(0, workedMinutes - expectedMinutes);
}

export interface AttendanceComputation {
  expectedIntervals: WorkInterval[];
  expectedMinutes: number;
  workedMinutes: number;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  overtimeMinutes: number;
}

/** Bundles every Gate 1 calculation for one record in one call — the composition every content component/test actually needs. */
export function computeAttendance(record: Pick<AttendanceRecord, "checkIn" | "checkOut">, expectedIntervals: WorkInterval[]): AttendanceComputation {
  const expectedMinutes = computeExpectedMinutes(expectedIntervals);
  const workedMinutes = record.checkIn && record.checkOut ? computeWorkedMinutes(record.checkIn, record.checkOut, expectedIntervals) : 0;

  return {
    expectedIntervals,
    expectedMinutes,
    workedMinutes,
    lateMinutes: record.checkIn ? computeLateMinutes(record.checkIn, expectedIntervals) : 0,
    earlyDepartureMinutes: record.checkOut ? computeEarlyDepartureMinutes(record.checkOut, expectedIntervals) : 0,
    overtimeMinutes: computeOvertimeMinutes(workedMinutes, expectedMinutes),
  };
}

/**
 * Resolves the operational attendance status (§13/§24-25) — `null` means
 * "rest day, no attendance expected at all" (a member with no expected
 * intervals that day, §25's own explicit integrity requirement), which is
 * distinct from every real `AttendanceStatus` value and is presented as
 * "Repos", not a status badge. `isPastDate` distinguishes "not yet checked
 * in today" (`not_checked_in`) from "a work day already passed with no
 * check-in at all" (`absent`, §24) — approved leave is applied by the
 * caller separately (§33), never folded into this enum.
 */
export function resolveAttendanceStatus(
  record: Pick<AttendanceRecord, "checkIn" | "checkOut">,
  expectedIntervals: WorkInterval[],
  isPastDate: boolean,
): AttendanceStatus | null {
  if (expectedIntervals.length === 0) return null;

  if (!record.checkIn) {
    return isPastDate ? "absent" : "not_checked_in";
  }

  if (record.checkOut) {
    return "completed";
  }

  return computeLateMinutes(record.checkIn, expectedIntervals) > 0 ? "late" : "present";
}

export type CabinetAttendanceBucket = "present" | "late" | "absent" | "not_checked_in";

/**
 * The cabinet workspace's own 4 operational buckets (§22: PRÉSENTS/EN
 * RETARD/ABSENTS/NON POINTÉS) — not a 1:1 relabeling of `AttendanceStatus`
 * (a `"completed"` day that started late still belongs in "EN RETARD", not
 * "PRÉSENTS" — lateness is a fixed historical fact about the arrival, not
 * overridden by finishing the day). `null` in means a rest day, which has
 * no bucket at all (excluded from every count, §25).
 */
export function resolveCabinetBucket(status: AttendanceStatus | null, lateMinutes: number): CabinetAttendanceBucket | null {
  if (status === null) return null;
  if (status === "absent") return "absent";
  if (status === "not_checked_in") return "not_checked_in";
  return lateMinutes > 0 ? "late" : "present";
}

export interface CabinetAttendanceCounts {
  present: number;
  late: number;
  absent: number;
  notCheckedIn: number;
}

/** Rest-day members (`null` bucket) are excluded from every count (§25) — a day off is not "not checked in." */
export function summarizeCabinetAttendance(buckets: (CabinetAttendanceBucket | null)[]): CabinetAttendanceCounts {
  const counts: CabinetAttendanceCounts = { present: 0, late: 0, absent: 0, notCheckedIn: 0 };

  for (const bucket of buckets) {
    if (bucket === "present") counts.present += 1;
    else if (bucket === "late") counts.late += 1;
    else if (bucket === "absent") counts.absent += 1;
    else if (bucket === "not_checked_in") counts.notCheckedIn += 1;
  }

  return counts;
}
