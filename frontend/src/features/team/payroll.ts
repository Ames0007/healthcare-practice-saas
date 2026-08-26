import type { AttendanceRecord, PayrollAdjustment, PayrollEntry, PayrollPeriod, WorkInterval } from "@/components/domain/team/types";
import { computeAttendance, getExpectedIntervalsForDate } from "./attendance";

export function sortPayrollPeriodsDesc(periods: PayrollPeriod[]): PayrollPeriod[] {
  return [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function getPayrollEntryForMember(entries: PayrollEntry[], payrollPeriodId: string, teamMemberId: string): PayrollEntry | null {
  return entries.find((entry) => entry.payrollPeriodId === payrollPeriodId && entry.teamMemberId === teamMemberId) ?? null;
}

function sumAdjustments(adjustments: PayrollAdjustment[]): number {
  return adjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0);
}

export function computeBonusesTotal(entry: Pick<PayrollEntry, "bonuses">): number {
  return sumAdjustments(entry.bonuses);
}

export function computeDeductionsTotal(entry: Pick<PayrollEntry, "deductions">): number {
  return sumAdjustments(entry.deductions);
}

/**
 * Base + bonuses + commission (UI-007CDEF §46) — deliberately excludes any
 * overtime money: no monetary overtime rate/multiplier is defined by the
 * approved specifications, so eligible overtime remuneration contributes
 * 0 to gross in this prototype (§43/§21 — `overtimeMinutes` is shown as a
 * duration only, never silently folded into `baseAmount`).
 */
export function computeGrossPayable(entry: Pick<PayrollEntry, "baseAmount" | "bonuses" | "commissionAmount">): number {
  return entry.baseAmount + computeBonusesTotal(entry) + (entry.commissionAmount ?? 0);
}

export function computeNetPayable(entry: Pick<PayrollEntry, "baseAmount" | "bonuses" | "deductions" | "commissionAmount">): number {
  return computeGrossPayable(entry) - computeDeductionsTotal(entry);
}

/**
 * Sums Gate 1's own per-day overtime across every attendance record a
 * member has within a payroll period's own date range (§42 — payroll
 * overtime duration must derive from attendance, never be entered
 * independently). A `PayrollEntry.overtimeMinutes` fixture is expected to
 * equal this exactly for the same member/period — proven directly by
 * `mock-payroll-data.test.ts` rather than trusted by construction.
 */
export function computePeriodOvertimeMinutes(
  attendanceRecords: AttendanceRecord[],
  workIntervals: WorkInterval[],
  teamMemberId: string,
  periodStart: string,
  periodEnd: string,
): number {
  return attendanceRecords
    .filter((record) => record.teamMemberId === teamMemberId && record.businessDate >= periodStart && record.businessDate <= periodEnd)
    .reduce((sum, record) => {
      const expected = getExpectedIntervalsForDate(workIntervals, teamMemberId, record.businessDate);
      return sum + computeAttendance(record, expected).overtimeMinutes;
    }, 0);
}
