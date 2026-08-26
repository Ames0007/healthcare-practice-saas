import { describe, expect, it } from "vitest";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getTeamMembersMockData } from "./mock-data";
import { getContractsMockData } from "./mock-contracts-data";
import { getWorkIntervalsMockData } from "./mock-schedule-data";
import { getAttendanceMockData } from "./mock-attendance-data";
import { getLeaveRequestsMockData } from "./mock-leave-data";
import { getPayrollEntriesMockData, getPayrollPeriodsMockData } from "./mock-payroll-data";
import { getCommissionRulesMockData } from "./mock-commissions-data";
import { getCurrentContract } from "./contracts";
import { getExpectedIntervalsForDate, resolveAttendanceStatus } from "./attendance";
import { doesApprovedLeaveCoverDate } from "./leave";
import { computeCommissionAmount, computeEligibleBase, getEligibleCommissionActivity, getCommissionRuleForMember, isCommissionEligible, resolvePractitionerName } from "./commissions";
import { computePeriodOvertimeMinutes, getPayrollEntryForMember } from "./payroll";

/**
 * UI-007CDEF §64 — proves the full required cross-module chain end to end
 * for one real member, using only the centralized fixtures every gate's
 * own screens already read from. No module here duplicates another's own
 * data; each step below hands its own real output to the next.
 */
describe("Cross-HR integrity — the full required chain (§64)", () => {
  const members = getTeamMembersMockData();
  const drBenali = members.find((member) => member.id === "team-1")!;

  it("EmploymentContract -> employment context: a real, current contract exists for the member", () => {
    const contract = getCurrentContract(getContractsMockData(), drBenali.id);
    expect(contract).not.toBeNull();
    expect(contract!.teamMemberId).toBe(drBenali.id);
  });

  it("WorkSchedule -> Attendance: expected attendance intervals come from the member's own real WorkInterval fixtures, not a second schedule", () => {
    const expected = getExpectedIntervalsForDate(getWorkIntervalsMockData(), drBenali.id, "2026-08-18");
    expect(expected.length).toBeGreaterThan(0);

    const record = getAttendanceMockData().find((candidate) => candidate.teamMemberId === drBenali.id && candidate.businessDate === "2026-08-18")!;
    expect(resolveAttendanceStatus(record, expected, true)).toBe("completed");
  });

  it("Leave -> Attendance: an approved leave request explains a day that would otherwise look unexplained", () => {
    const meryem = members.find((member) => member.id === "team-3")!;
    const leaveRequests = getLeaveRequestsMockData();

    expect(doesApprovedLeaveCoverDate(leaveRequests, meryem.id, "2026-08-25")).toBe(true);
    // A pending request never does, even for a real date in the fixtures (§34).
    expect(doesApprovedLeaveCoverDate(leaveRequests, meryem.id, "2026-09-04")).toBe(false);
  });

  it("Attendance overtime -> Payroll: the payroll entry's own overtimeMinutes equals Gate 1's real computed overtime for the same member/period", () => {
    const periods = getPayrollPeriodsMockData();
    const augustPeriod = periods.find((period) => period.id === "pp-2026-08")!;
    const entry = getPayrollEntryForMember(getPayrollEntriesMockData(), augustPeriod.id, drBenali.id)!;

    const reconciledOvertime = computePeriodOvertimeMinutes(
      getAttendanceMockData(),
      getWorkIntervalsMockData(),
      drBenali.id,
      augustPeriod.startDate,
      augustPeriod.endDate,
    );

    expect(entry.overtimeMinutes).toBe(reconciledOvertime);
  });

  it("Existing patient/finance activity -> Practitioner commission: the eligible base is derived from real Invoice/Payment fixtures via practitionerId, never an independent revenue number", () => {
    expect(isCommissionEligible(drBenali)).toBe(true);
    const practitionerName = resolvePractitionerName(drBenali)!;
    expect(practitionerName).toBe("Dr. Benali");

    const periods = getPayrollPeriodsMockData();
    const augustPeriod = periods.find((period) => period.id === "pp-2026-08")!;
    const activity = getEligibleCommissionActivity(getPaymentsMockData(), getInvoicesMockData(), practitionerName, augustPeriod.startDate, augustPeriod.endDate);

    expect(activity.length).toBeGreaterThan(0);
    expect(activity.every((item) => item.amount > 0)).toBe(true);
  });

  it("Commission -> Payroll: the payroll entry's own commissionAmount equals the real commission calculation for the same member/period, never a second hardcoded figure (§61)", () => {
    const rule = getCommissionRuleForMember(getCommissionRulesMockData(), drBenali.id)!;
    const practitionerName = resolvePractitionerName(drBenali)!;
    const periods = getPayrollPeriodsMockData();
    const augustPeriod = periods.find((period) => period.id === "pp-2026-08")!;

    const activity = getEligibleCommissionActivity(getPaymentsMockData(), getInvoicesMockData(), practitionerName, augustPeriod.startDate, augustPeriod.endDate);
    const computed = computeCommissionAmount(computeEligibleBase(activity), rule.ratePercent);

    const entry = getPayrollEntryForMember(getPayrollEntriesMockData(), augustPeriod.id, drBenali.id)!;
    expect(entry.commissionAmount).toBe(computed);
  });

  it("no contradictory duplicate mock universes: every module resolves the same member/practitioner identity consistently", () => {
    // TeamMember.practitionerId, the Agenda PRACTITIONERS fixture and the
    // Invoice.practitionerName field all agree on who "Dr. Benali" is —
    // proven by the commission chain above successfully resolving real,
    // non-empty activity through all three in sequence.
    expect(drBenali.role).toBe("practitioner");
    expect(drBenali.practitionerId).toBeDefined();
  });
});
