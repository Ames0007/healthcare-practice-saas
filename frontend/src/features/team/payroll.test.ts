import { describe, expect, it } from "vitest";
import type { AttendanceRecord, PayrollEntry, PayrollPeriod, WorkInterval } from "@/components/domain/team/types";
import {
  computeBonusesTotal,
  computeDeductionsTotal,
  computeGrossPayable,
  computeNetPayable,
  computePeriodOvertimeMinutes,
  getPayrollEntryForMember,
  sortPayrollPeriodsDesc,
} from "./payroll";

const meryemJuly: PayrollEntry = {
  id: "pe-1",
  payrollPeriodId: "pp-07",
  teamMemberId: "team-3",
  baseAmount: 5000,
  overtimeMinutes: 0,
  bonuses: [{ id: "b1", label: "Prime ponctualité", amount: 300 }],
  deductions: [],
  status: "paid",
};

const drAmalAugust: PayrollEntry = {
  id: "pe-2",
  payrollPeriodId: "pp-08",
  teamMemberId: "team-2",
  baseAmount: 8000,
  overtimeMinutes: 0,
  bonuses: [],
  deductions: [{ id: "d1", label: "Avance", amount: 500 }],
  commissionAmount: 3200,
  status: "unpaid",
};

describe("computeBonusesTotal / computeDeductionsTotal", () => {
  it("sums each list's own amounts independently", () => {
    expect(computeBonusesTotal(meryemJuly)).toBe(300);
    expect(computeDeductionsTotal(meryemJuly)).toBe(0);
    expect(computeDeductionsTotal(drAmalAugust)).toBe(500);
  });
});

describe("computeGrossPayable / computeNetPayable", () => {
  it("matches this task's own §47 worked example exactly (5000 base + 300 bonus, no commission = 5300 net)", () => {
    expect(computeGrossPayable(meryemJuly)).toBe(5300);
    expect(computeNetPayable(meryemJuly)).toBe(5300);
  });

  it("matches this task's own §40 worked example exactly (8000 base + 3200 commission = 11200 gross)", () => {
    expect(computeGrossPayable(drAmalAugust)).toBe(11200);
  });

  it("subtracts deductions only from gross to reach net, never from a bonus/commission independently", () => {
    expect(computeNetPayable(drAmalAugust)).toBe(11200 - 500);
  });

  it("never includes overtime money — overtimeMinutes contributes nothing to gross (§43)", () => {
    const withOvertime: PayrollEntry = { ...meryemJuly, overtimeMinutes: 600 };
    expect(computeGrossPayable(withOvertime)).toBe(computeGrossPayable(meryemJuly));
  });

  it("treats a missing commissionAmount as zero, not an error", () => {
    expect(computeGrossPayable({ baseAmount: 1000, bonuses: [], commissionAmount: undefined })).toBe(1000);
  });
});

describe("getPayrollEntryForMember / sortPayrollPeriodsDesc", () => {
  it("finds the exact period+member entry, or null", () => {
    expect(getPayrollEntryForMember([meryemJuly, drAmalAugust], "pp-07", "team-3")).toEqual(meryemJuly);
    expect(getPayrollEntryForMember([meryemJuly], "pp-08", "team-3")).toBeNull();
  });

  it("sorts periods newest-started first", () => {
    const periods: PayrollPeriod[] = [
      { id: "pp-07", label: "Juillet 2026", startDate: "2026-07-01", endDate: "2026-07-31", status: "finalized" },
      { id: "pp-08", label: "Août 2026", startDate: "2026-08-01", endDate: "2026-08-31", status: "draft" },
    ];
    expect(sortPayrollPeriodsDesc(periods).map((p) => p.id)).toEqual(["pp-08", "pp-07"]);
  });
});

describe("computePeriodOvertimeMinutes (§42 — the Gate 1 <-> Gate 3 integration point)", () => {
  const monday: WorkInterval[] = [{ id: "wi-1", teamMemberId: "m-1", weekday: "monday", startTime: "08:00", endTime: "16:00", active: true }];

  it("sums only this member's own overtime minutes within the period's own date range", () => {
    const records: AttendanceRecord[] = [
      { id: "a1", teamMemberId: "m-1", businessDate: "2026-08-17", checkIn: "07:00", checkOut: "16:00" }, // Monday, +60 overtime
      { id: "a2", teamMemberId: "m-1", businessDate: "2026-07-20", checkIn: "07:00", checkOut: "16:00" }, // outside the period
      { id: "a3", teamMemberId: "m-2", businessDate: "2026-08-17", checkIn: "07:00", checkOut: "16:00" }, // different member
    ];
    expect(computePeriodOvertimeMinutes(records, monday, "m-1", "2026-08-01", "2026-08-31")).toBe(60);
  });

  it("is zero when no attendance record falls inside the period", () => {
    expect(computePeriodOvertimeMinutes([], monday, "m-1", "2026-08-01", "2026-08-31")).toBe(0);
  });
});
