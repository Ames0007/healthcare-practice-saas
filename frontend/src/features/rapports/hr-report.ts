import type { AttendanceRecord, TeamMember, WorkInterval } from "@/components/domain/team/types";
import type { HrReportKpis } from "@/components/domain/reports/types";
import type { PeriodRange } from "@/features/finance/aggregations";
import { computeAttendance, getExpectedIntervalsForDate } from "@/features/team/attendance";
import { computePeriodOvertimeMinutes } from "@/features/team/payroll";

/** ISO `YYYY-MM-DD` strings compare correctly with plain string operators (mirrors `features/finance/aggregations.ts`'s own `isWithinRange`). */
function isWithinRange(dateIso: string, range: PeriodRange): boolean {
  return dateIso >= range.start && dateIso <= range.end;
}

/**
 * Cabinet-wide HR KPIs for the selected period (Spec #2 §42.4, task's own
 * Overview wireframe: "Heures travaillées / Retards / Heures
 * supplémentaires"). Every figure reuses Équipe's own Gate 1/Gate 3 pure
 * functions (`computeAttendance`, `computePeriodOvertimeMinutes`) per
 * attendance record — never a second, independently-derived worked/late/
 * overtime calculation. `activeHeadcount` is a current fact (not
 * period-scoped), matching `StockKpis`'s own "current state, not
 * activity" precedent for balance-like figures.
 */
export function computeHrReportKpis(
  members: TeamMember[],
  attendanceRecords: AttendanceRecord[],
  workIntervals: WorkInterval[],
  range: PeriodRange,
): HrReportKpis {
  const activeMembers = members.filter((member) => member.status === "active");
  const inRange = attendanceRecords.filter((record) => isWithinRange(record.businessDate, range));

  let workedMinutesTotal = 0;
  let lateCount = 0;

  for (const record of inRange) {
    const expected = getExpectedIntervalsForDate(workIntervals, record.teamMemberId, record.businessDate);
    const computation = computeAttendance(record, expected);
    workedMinutesTotal += computation.workedMinutes;
    if (computation.lateMinutes > 0) lateCount += 1;
  }

  const overtimeMinutesTotal = activeMembers.reduce(
    (sum, member) => sum + computePeriodOvertimeMinutes(attendanceRecords, workIntervals, member.id, range.start, range.end),
    0,
  );

  return {
    workedHours: Math.round((workedMinutesTotal / 60) * 10) / 10,
    lateCount,
    overtimeHours: Math.round((overtimeMinutesTotal / 60) * 10) / 10,
    activeHeadcount: activeMembers.length,
  };
}
