import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "./mock-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPayrollEntriesMockData, getPayrollPeriodsMockData } from "./mock-payroll-data";
import { getCommissionRulesMockData } from "./mock-commissions-data";
import {
  computeCommissionAmount,
  computeEligibleBase,
  getCommissionRuleForMember,
  getEligibleCommissionActivity,
  isCommissionEligible,
  resolvePractitionerName,
} from "./commissions";

describe("getCommissionRulesMockData fixture integrity (UI-007CDEF Gate 4)", () => {
  it("every rule's teamMemberId resolves to a real, commission-eligible TeamMember", () => {
    const members = getTeamMembersMockData();

    for (const rule of getCommissionRulesMockData()) {
      const member = members.find((candidate) => candidate.id === rule.teamMemberId);
      expect(member).toBeDefined();
      expect(isCommissionEligible(member!)).toBe(true);
    }
  });

  it("has unique ids and no duplicate active rule per member", () => {
    const rules = getCommissionRulesMockData();
    expect(new Set(rules.map((rule) => rule.id)).size).toBe(rules.length);

    const activeMemberIds = rules.filter((rule) => rule.status === "active").map((rule) => rule.teamMemberId);
    expect(new Set(activeMemberIds).size).toBe(activeMemberIds.length);
  });

  it("Othmane Zouiten (practitioner role, no practitionerId) deliberately has no commission rule (§56)", () => {
    const othmane = getTeamMembersMockData().find((member) => member.id === "team-7")!;
    expect(othmane.role).toBe("practitioner");
    expect(othmane.practitionerId).toBeUndefined();
    expect(getCommissionRuleForMember(getCommissionRulesMockData(), "team-7")).toBeNull();
  });

  it("every non-practitioner team member has no commission rule (§52/§62)", () => {
    const members = getTeamMembersMockData();
    const rules = getCommissionRulesMockData();

    for (const member of members) {
      if (member.role !== "practitioner") {
        expect(getCommissionRuleForMember(rules, member.id)).toBeNull();
      }
    }
  });
});

describe("Gate 3 <-> Gate 4 reconciliation (§61 — payroll commissionAmount must derive from the real commission calculation)", () => {
  it("Dr. Benali's payroll commissionAmount equals computeCommissionAmount's own real output for every period he has a payroll entry in", () => {
    const rule = getCommissionRuleForMember(getCommissionRulesMockData(), "team-1")!;
    const practitionerName = resolvePractitionerName({ practitionerId: "pr-1" })!;
    const payments = getPaymentsMockData();
    const invoices = getInvoicesMockData();
    const periods = getPayrollPeriodsMockData();

    for (const entry of getPayrollEntriesMockData().filter((candidate) => candidate.teamMemberId === "team-1")) {
      const period = periods.find((candidate) => candidate.id === entry.payrollPeriodId)!;
      const activity = getEligibleCommissionActivity(payments, invoices, practitionerName, period.startDate, period.endDate);
      const expected = computeCommissionAmount(computeEligibleBase(activity), rule.ratePercent);

      expect(entry.commissionAmount).toBe(expected);
    }
  });

  it("Meryem Bakkali's (non-practitioner) payroll entries never carry a commissionAmount", () => {
    for (const entry of getPayrollEntriesMockData().filter((candidate) => candidate.teamMemberId === "team-3")) {
      expect(entry.commissionAmount).toBeUndefined();
    }
  });
});
