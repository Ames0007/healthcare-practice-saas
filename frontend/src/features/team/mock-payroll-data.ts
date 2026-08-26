import type { PayrollEntry, PayrollPeriod } from "@/components/domain/team/types";

/**
 * Two periods (UI-007CDEF §38/§48): "Juillet 2026" (finalized — historical,
 * read-only, §50) and "Août 2026" (draft — the current, editable period).
 * No third/fourth period — a restrained history, not a full payroll-runs
 * archive (§48).
 */
export function getPayrollPeriodsMockData(): PayrollPeriod[] {
  return [
    { id: "pp-2026-07", label: "Juillet 2026", startDate: "2026-07-01", endDate: "2026-07-31", status: "finalized" },
    { id: "pp-2026-08", label: "Août 2026", startDate: "2026-08-01", endDate: "2026-08-31", status: "draft" },
  ];
}

/**
 * Centralized synthetic payroll entries. Meryem Bakkali's (team-3) own
 * July entry deliberately reproduces this task's own §47 worked example
 * numbers exactly (base 5 000 + bonus 300 = net 5 300, no commission —
 * she is not a practitioner). Dr. Benali's (team-1) `commissionAmount`
 * is not an independent guess — it equals `computeCommissionAmount`'s own
 * real output for his real collected payments in each period, proven by
 * `mock-payroll-data.test.ts` once Gate 4 exists (§61). His August
 * `overtimeMinutes` (15) equals Gate 1's own real attendance overtime for
 * him that period (his one overtime day, 2026-08-19) — reconciled, not
 * independently entered (§42). No statutory tax/CNSS/AMO/IR line exists
 * anywhere (§37/§77).
 */
export function getPayrollEntriesMockData(): PayrollEntry[] {
  return [
    {
      id: "pe-2026-07-team-1",
      payrollPeriodId: "pp-2026-07",
      teamMemberId: "team-1",
      baseAmount: 8000,
      overtimeMinutes: 0,
      bonuses: [],
      deductions: [],
      commissionAmount: 300,
      status: "paid",
    },
    {
      id: "pe-2026-07-team-3",
      payrollPeriodId: "pp-2026-07",
      teamMemberId: "team-3",
      baseAmount: 5000,
      overtimeMinutes: 0,
      bonuses: [{ id: "adj-1", label: "Prime ponctualité", amount: 300 }],
      deductions: [],
      status: "paid",
    },
    {
      id: "pe-2026-08-team-1",
      payrollPeriodId: "pp-2026-08",
      teamMemberId: "team-1",
      baseAmount: 8000,
      overtimeMinutes: 15,
      bonuses: [],
      deductions: [],
      commissionAmount: 300,
      status: "unpaid",
    },
    {
      id: "pe-2026-08-team-3",
      payrollPeriodId: "pp-2026-08",
      teamMemberId: "team-3",
      baseAmount: 5000,
      overtimeMinutes: 35,
      bonuses: [{ id: "adj-2", label: "Prime ponctualité", amount: 300 }],
      deductions: [{ id: "adj-3", label: "Avance sur salaire", amount: 200 }],
      status: "unpaid",
    },
    // team-4 (Nawal Chaoui) deliberately has no payroll entry in any period — the empty-state demo.
  ];
}
