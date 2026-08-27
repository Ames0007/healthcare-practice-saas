import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { generatePatientNumber } from "@/features/patients/patient-number";
import { generateEmployeeNumber } from "@/features/team/employee-number";
import { computeNumberingSummary } from "./numbering";

describe("computeNumberingSummary (real fixtures)", () => {
  const rows = computeNumberingSummary(
    getPatientsMockData(),
    getTeamMembersMockData(),
    getInvoicesMockData(),
    getPaymentsMockData(),
    MOCK_BUSINESS_DATE,
  );

  it("returns exactly the 4 sequences, in a fixed order", () => {
    expect(rows.map((row) => row.sequenceType)).toEqual(["PAT", "EMP", "FAC", "REC"]);
  });

  it("PAT/EMP reconcile exactly with the real generators — never a second, independent computation", () => {
    expect(rows.find((row) => row.sequenceType === "PAT")?.nextNumber).toBe(generatePatientNumber(getPatientsMockData()));
    expect(rows.find((row) => row.sequenceType === "EMP")?.nextNumber).toBe(generateEmployeeNumber(getTeamMembersMockData()));
  });

  it("FAC: next number is FAC-2026-00143 (highest existing is FAC-2026-00142)", () => {
    expect(rows.find((row) => row.sequenceType === "FAC")?.nextNumber).toBe("FAC-2026-00143");
  });

  it("REC: next number is REC-2026-00383 (highest existing is REC-2026-00382; pay-4 is reversed and has no receipt)", () => {
    expect(rows.find((row) => row.sequenceType === "REC")?.nextNumber).toBe("REC-2026-00383");
  });

  it("FAC/REC are year-reset sequences, PAT/EMP are not", () => {
    expect(rows.find((row) => row.sequenceType === "FAC")?.yearReset).toBe(true);
    expect(rows.find((row) => row.sequenceType === "REC")?.yearReset).toBe(true);
    expect(rows.find((row) => row.sequenceType === "PAT")?.yearReset).toBe(false);
    expect(rows.find((row) => row.sequenceType === "EMP")?.yearReset).toBe(false);
  });

  it("a different business-date year resets FAC/REC to 00001 (no invoice/receipt issued in that year)", () => {
    const futureRows = computeNumberingSummary(getPatientsMockData(), getTeamMembersMockData(), getInvoicesMockData(), getPaymentsMockData(), "2027-01-01");
    expect(futureRows.find((row) => row.sequenceType === "FAC")?.nextNumber).toBe("FAC-2027-00001");
  });
});
