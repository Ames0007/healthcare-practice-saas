import { describe, expect, it } from "vitest";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import {
  computeCommissionAmount,
  computeEligibleBase,
  getCommissionRuleForMember,
  getEligibleCommissionActivity,
  isCommissionEligible,
  resolvePractitionerName,
} from "./commissions";

const invoices: Invoice[] = [
  {
    id: "inv-a",
    patientId: "pat-1",
    invoiceNumber: "FAC-1",
    issuedDate: "2026-08-01",
    status: "partially_paid",
    currency: "MAD",
    description: "Consultation",
    practitionerName: "Dr. Benali",
    totalAmount: 1000,
    paidAmount: 500,
    remainingAmount: 500,
    lines: [],
    installments: [],
  },
  {
    id: "inv-b",
    patientId: "pat-2",
    invoiceNumber: "FAC-2",
    issuedDate: "2026-08-05",
    status: "paid",
    currency: "MAD",
    description: "Traitement",
    practitionerName: "Dr. Amal",
    totalAmount: 800,
    paidAmount: 800,
    remainingAmount: 0,
    lines: [],
    installments: [],
  },
];

const payments: Payment[] = [
  {
    id: "pay-a",
    patientId: "pat-1",
    paymentNumber: "PAY-1",
    paymentDate: "2026-08-10",
    amount: 500,
    method: "cash",
    status: "posted",
    allocations: [{ id: "al-1", paymentId: "pay-a", invoiceId: "inv-a", amount: 500 }],
  },
  {
    id: "pay-b",
    patientId: "pat-1",
    paymentNumber: "PAY-2",
    paymentDate: "2026-07-20",
    amount: 300,
    method: "cash",
    status: "posted",
    allocations: [{ id: "al-2", paymentId: "pay-b", invoiceId: "inv-a", amount: 300 }],
  },
  {
    id: "pay-c",
    patientId: "pat-2",
    paymentNumber: "PAY-3",
    paymentDate: "2026-08-12",
    amount: 800,
    method: "cash",
    status: "reversed",
    allocations: [{ id: "al-3", paymentId: "pay-c", invoiceId: "inv-b", amount: 800 }],
  },
];

describe("isCommissionEligible (§56)", () => {
  it("requires both a practitioner role and a real practitionerId", () => {
    expect(isCommissionEligible({ role: "practitioner", practitionerId: "pr-1" })).toBe(true);
    expect(isCommissionEligible({ role: "practitioner", practitionerId: undefined })).toBe(false);
    expect(isCommissionEligible({ role: "receptionist", practitionerId: "pr-1" })).toBe(false);
  });
});

describe("resolvePractitionerName", () => {
  it("resolves a real linked practitioner's own name", () => {
    expect(resolvePractitionerName({ practitionerId: "pr-1" })).toBe("Dr. Benali");
  });

  it("is null without a practitionerId", () => {
    expect(resolvePractitionerName({ practitionerId: undefined })).toBeNull();
  });
});

describe("getEligibleCommissionActivity (§54-55/§57)", () => {
  it("includes only posted payments allocated to this practitioner's own invoices, within the period", () => {
    const activity = getEligibleCommissionActivity(payments, invoices, "Dr. Benali", "2026-08-01", "2026-08-31");
    expect(activity).toHaveLength(1);
    expect(activity[0]).toMatchObject({ paymentId: "pay-a", amount: 500, patientId: "pat-1" });
  });

  it("excludes a reversed payment even if its allocation matches (§60/WF-40 — never double-count, never phantom revenue)", () => {
    const activity = getEligibleCommissionActivity(payments, invoices, "Dr. Amal", "2026-08-01", "2026-08-31");
    expect(activity).toHaveLength(0);
  });

  it("excludes a payment outside the requested period", () => {
    const activity = getEligibleCommissionActivity(payments, invoices, "Dr. Benali", "2026-08-01", "2026-08-31");
    expect(activity.some((item) => item.paymentId === "pay-b")).toBe(false); // pay-b is dated in July
  });

  it("sums correctly across multiple payments without double-counting (WF-40 acceptance criterion)", () => {
    const julyThroughAugust = getEligibleCommissionActivity(payments, invoices, "Dr. Benali", "2026-07-01", "2026-08-31");
    expect(computeEligibleBase(julyThroughAugust)).toBe(800); // 500 + 300, each counted exactly once
  });

  it("carries only patient reference, date, service description and amount — no clinical data (§60)", () => {
    const activity = getEligibleCommissionActivity(payments, invoices, "Dr. Benali", "2026-08-01", "2026-08-31");
    const keys = Object.keys(activity[0]).sort();
    expect(keys).toEqual(["amount", "date", "description", "patientId", "paymentId"]);
  });
});

describe("computeEligibleBase / computeCommissionAmount", () => {
  it("matches the task's own WF-40 worked example exactly (4 000 x 30% = 1 200 MAD)", () => {
    expect(computeCommissionAmount(4000, 30)).toBe(1200);
  });

  it("is zero for zero eligible activity", () => {
    expect(computeEligibleBase([])).toBe(0);
    expect(computeCommissionAmount(0, 30)).toBe(0);
  });
});

describe("getCommissionRuleForMember", () => {
  it("returns only an active rule for the given member", () => {
    const rules = [
      { id: "cr-1", teamMemberId: "m-1", basis: "collected_payments" as const, ratePercent: 20, status: "active" as const },
      { id: "cr-2", teamMemberId: "m-2", basis: "collected_payments" as const, ratePercent: 20, status: "inactive" as const },
    ];
    expect(getCommissionRuleForMember(rules, "m-1")?.id).toBe("cr-1");
    expect(getCommissionRuleForMember(rules, "m-2")).toBeNull();
    expect(getCommissionRuleForMember(rules, "m-does-not-exist")).toBeNull();
  });
});
