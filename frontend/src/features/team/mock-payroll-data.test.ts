import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "./mock-data";
import { getAttendanceMockData } from "./mock-attendance-data";
import { getWorkIntervalsMockData } from "./mock-schedule-data";
import { getPayrollEntriesMockData, getPayrollPeriodsMockData } from "./mock-payroll-data";
import { computeNetPayable, computePeriodOvertimeMinutes } from "./payroll";

describe("getPayrollPeriodsMockData fixture integrity (UI-007CDEF Gate 3)", () => {
  it("has unique ids and covers both a finalized and a draft period", () => {
    const periods = getPayrollPeriodsMockData();
    expect(new Set(periods.map((period) => period.id)).size).toBe(periods.length);
    expect(periods.some((period) => period.status === "finalized")).toBe(true);
    expect(periods.some((period) => period.status === "draft")).toBe(true);
  });
});

describe("getPayrollEntriesMockData fixture integrity", () => {
  it("every entry's teamMemberId and payrollPeriodId resolve to real records", () => {
    const memberIds = new Set(getTeamMembersMockData().map((member) => member.id));
    const periodIds = new Set(getPayrollPeriodsMockData().map((period) => period.id));

    for (const entry of getPayrollEntriesMockData()) {
      expect(memberIds.has(entry.teamMemberId)).toBe(true);
      expect(periodIds.has(entry.payrollPeriodId)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const entries = getPayrollEntriesMockData();
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
  });

  it("carries no invented statutory tax/CNSS/AMO/IR line anywhere (§37/§77)", () => {
    for (const entry of getPayrollEntriesMockData()) {
      const allLabels = [...entry.bonuses, ...entry.deductions].map((adjustment) => adjustment.label.toLowerCase());
      for (const label of allLabels) {
        expect(label).not.toMatch(/cnss|amo|ir\b|imp[oô]t|tax/);
      }
    }
  });

  it("reproduces this task's own §47 worked example exactly for Meryem Bakkali's July entry", () => {
    const entry = getPayrollEntriesMockData().find((candidate) => candidate.id === "pe-2026-07-team-3")!;
    expect(entry.baseAmount).toBe(5000);
    expect(entry.bonuses).toEqual([{ id: "adj-1", label: "Prime ponctualité", amount: 300 }]);
    expect(entry.commissionAmount).toBeUndefined();
    expect(computeNetPayable(entry)).toBe(5300);
  });

  it("Dr. Benali's August overtimeMinutes reconciles exactly with Gate 1's own real attendance overtime for that period (§42)", () => {
    const entry = getPayrollEntriesMockData().find((candidate) => candidate.id === "pe-2026-08-team-1")!;
    const period = getPayrollPeriodsMockData().find((candidate) => candidate.id === entry.payrollPeriodId)!;
    const reconciled = computePeriodOvertimeMinutes(getAttendanceMockData(), getWorkIntervalsMockData(), "team-1", period.startDate, period.endDate);

    expect(entry.overtimeMinutes).toBe(reconciled);
  });

  it("has at least one member with no payroll entry at all in any period (empty-state demo)", () => {
    const members = getTeamMembersMockData();
    const entries = getPayrollEntriesMockData();
    const paidMemberIds = new Set(entries.map((entry) => entry.teamMemberId));
    expect(members.some((member) => !paidMemberIds.has(member.id))).toBe(true);
  });
});
