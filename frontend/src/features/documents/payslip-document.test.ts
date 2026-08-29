import { describe, expect, it } from "vitest";
import { getPayrollEntriesMockData, getPayrollPeriodsMockData } from "@/features/team/mock-payroll-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { computeNetPayable } from "@/features/team/payroll";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getDocumentSettingsMockData } from "@/features/parametres/mock-document-settings-data";
import { buildPayslipDocument } from "./payslip-document";

const member = getTeamMembersMockData().find((candidate) => candidate.id === "team-3")!;
const period = getPayrollPeriodsMockData().find((candidate) => candidate.id === "pp-2026-07")!;
const entry = getPayrollEntriesMockData().find((candidate) => candidate.id === "pe-2026-07-team-3")!;
const cabinet = getCabinetProfileMockData();
const documentSettings = getDocumentSettingsMockData();

describe("buildPayslipDocument (UI-DOCS-X §24)", () => {
  it("matches the task's own filename example shape (employee number + YYYY-MM period)", () => {
    const model = buildPayslipDocument(member, period, entry, cabinet, documentSettings);
    expect(model.filename).toBe(`Bulletin-Paie-${member.employeeNumber}-2026-07.pdf`);
  });

  it("reconciles netAmount 1:1 against computeNetPayable — never a second payroll formula (§24)", () => {
    const model = buildPayslipDocument(member, period, entry, cabinet, documentSettings);
    expect(model.netAmount).toBe(computeNetPayable(entry));
    // Worked example from the fixture's own doc comment: base 5000 + bonus 300 = net 5300.
    expect(model.netAmount).toBe(5300);
  });

  it("carries the employee identity from the TeamMember, not a re-derived one", () => {
    const model = buildPayslipDocument(member, period, entry, cabinet, documentSettings);
    expect(model.employeeName).toBe(`${member.firstName} ${member.lastName}`);
    expect(model.employeeNumber).toBe(member.employeeNumber);
  });

  it("never includes a statutory tax/CNSS/AMO/IR line (§37/§77 non-scope)", () => {
    const model = buildPayslipDocument(member, period, entry, cabinet, documentSettings);
    expect(model).not.toHaveProperty("cnssAmount");
    expect(model).not.toHaveProperty("amoContribution");
    expect(model).not.toHaveProperty("incomeTax");
    expect(model).not.toHaveProperty("taxAmount");
  });

  it("lists every bonus/deduction adjustment line verbatim", () => {
    const model = buildPayslipDocument(member, period, entry, cabinet, documentSettings);
    expect(model.bonuses).toHaveLength(entry.bonuses.length);
    expect(model.bonuses[0].label).toBe(entry.bonuses[0].label);
  });
});
