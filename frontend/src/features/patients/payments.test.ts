import { describe, expect, it } from "vitest";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import {
  computeEffectiveRemaining,
  generatePaymentNumber,
  generateReceiptNumber,
  getAllocatableInvoices,
  getAllocatedTotal,
  getEffectivePaidAmount,
  getPayableInstallments,
  getPaymentSummary,
  getPaymentsForPatient,
  sortPaymentsDesc,
} from "./payments";

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-x",
    patientId: "pat-1",
    invoiceNumber: "FAC-TEST",
    issuedDate: "2026-08-01",
    status: "issued",
    currency: "MAD",
    description: "Test",
    practitionerName: "Dr. Test",
    totalAmount: 1000,
    paidAmount: 0,
    remainingAmount: 1000,
    lines: [],
    installments: [],
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-x",
    patientId: "pat-1",
    paymentNumber: "PAY-2026-9999",
    paymentDate: "2026-08-10",
    amount: 500,
    method: "cash",
    status: "posted",
    allocations: [{ id: "pay-x-a1", paymentId: "pay-x", invoiceId: "inv-x", amount: 500 }],
    ...overrides,
  };
}

describe("getPaymentsForPatient", () => {
  it("filters by patientId only", () => {
    const payments = [makePayment({ id: "a", patientId: "pat-1" }), makePayment({ id: "b", patientId: "pat-2" })];
    expect(getPaymentsForPatient(payments, "pat-1").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("sortPaymentsDesc", () => {
  it("orders newest payment date first", () => {
    const payments = [
      makePayment({ id: "old", paymentDate: "2026-07-01" }),
      makePayment({ id: "new", paymentDate: "2026-08-20" }),
      makePayment({ id: "mid", paymentDate: "2026-08-01" }),
    ];
    expect(sortPaymentsDesc(payments).map((p) => p.id)).toEqual(["new", "mid", "old"]);
  });
});

describe("getAllocatedTotal", () => {
  it("sums a payment's own allocations", () => {
    const payment = makePayment({
      amount: 800,
      allocations: [
        { id: "a1", paymentId: "pay-x", invoiceId: "inv-1", amount: 300 },
        { id: "a2", paymentId: "pay-x", invoiceId: "inv-2", amount: 500 },
      ],
    });
    expect(getAllocatedTotal(payment)).toBe(800);
  });
});

describe("getEffectivePaidAmount / getPaymentSummary", () => {
  it("excludes reversed payments from the total, count and last-payment date", () => {
    const payments = [
      makePayment({ id: "p1", paymentDate: "2026-08-01", amount: 500, status: "posted" }),
      makePayment({ id: "p2", paymentDate: "2026-08-20", amount: 2200, status: "reversed" }),
    ];

    expect(getEffectivePaidAmount(payments)).toBe(500);

    const summary = getPaymentSummary(payments);
    expect(summary).toEqual({ totalCollected: 500, paymentCount: 1, lastPaymentDate: "2026-08-01" });
  });

  it("reports no last payment when there is no posted payment at all", () => {
    const payments = [makePayment({ status: "reversed" })];
    expect(getPaymentSummary(payments).lastPaymentDate).toBeNull();
  });
});

describe("computeEffectiveRemaining", () => {
  it("subtracts only local posted payments, never seed history already baked into remainingAmount", () => {
    const invoices = [makeInvoice({ id: "inv-1", remainingAmount: 1500 })];
    const local = [makePayment({ allocations: [{ id: "a1", paymentId: "pay-x", invoiceId: "inv-1", amount: 500 }] })];

    const remaining = computeEffectiveRemaining(invoices, local);
    expect(remaining.get("inv-1")).toBe(1000);
  });

  it("ignores a reversed local payment's allocation", () => {
    const invoices = [makeInvoice({ id: "inv-1", remainingAmount: 1500 })];
    const local = [
      makePayment({
        status: "reversed",
        allocations: [{ id: "a1", paymentId: "pay-x", invoiceId: "inv-1", amount: 500 }],
      }),
    ];

    expect(computeEffectiveRemaining(invoices, local).get("inv-1")).toBe(1500);
  });
});

describe("getAllocatableInvoices", () => {
  it("excludes cancelled invoices and invoices with no positive effective remaining, sorted oldest-issued first", () => {
    const invoices = [
      makeInvoice({ id: "inv-new", issuedDate: "2026-08-15", remainingAmount: 500 }),
      makeInvoice({ id: "inv-old", issuedDate: "2026-07-01", remainingAmount: 200 }),
      makeInvoice({ id: "inv-paid", issuedDate: "2026-06-01", remainingAmount: 0, status: "paid" }),
      makeInvoice({ id: "inv-cancelled", issuedDate: "2026-05-01", remainingAmount: 300, status: "cancelled" }),
    ];
    const remaining = computeEffectiveRemaining(invoices, []);

    expect(getAllocatableInvoices(invoices, remaining).map((invoice) => invoice.id)).toEqual(["inv-old", "inv-new"]);
  });

  it("excludes an invoice a local payment has fully paid off this session", () => {
    const invoices = [makeInvoice({ id: "inv-1", remainingAmount: 500 })];
    const local = [makePayment({ allocations: [{ id: "a1", paymentId: "pay-x", invoiceId: "inv-1", amount: 500 }] })];
    const remaining = computeEffectiveRemaining(invoices, local);

    expect(getAllocatableInvoices(invoices, remaining)).toEqual([]);
  });
});

describe("getPayableInstallments", () => {
  const invoice = makeInvoice({
    id: "inv-1",
    installments: [
      { id: "i1", invoiceId: "inv-1", sequenceNumber: 1, dueDate: "2026-08-01", amount: 500, status: "paid" },
      { id: "i2", invoiceId: "inv-1", sequenceNumber: 2, dueDate: "2026-09-15", amount: 500, status: "future" },
      { id: "i3", invoiceId: "inv-1", sequenceNumber: 3, dueDate: "2026-09-01", amount: 500, status: "due" },
      { id: "i4", invoiceId: "inv-1", sequenceNumber: 4, dueDate: "2026-08-05", amount: 500, status: "overdue" },
    ],
  });

  it("excludes already-paid installments and ranks overdue, then due, then future", () => {
    const result = getPayableInstallments(invoice, []);
    expect(result.map((installment) => installment.id)).toEqual(["i4", "i3", "i2"]);
  });

  it("excludes an installment a local payment already covered this session", () => {
    const local = [makePayment({ allocations: [{ id: "a1", paymentId: "pay-x", invoiceId: "inv-1", installmentId: "i4", amount: 500 }] })];
    const result = getPayableInstallments(invoice, local);
    expect(result.map((installment) => installment.id)).toEqual(["i3", "i2"]);
  });

  it("does not exclude an installment covered only by a reversed local payment", () => {
    const local = [
      makePayment({
        status: "reversed",
        allocations: [{ id: "a1", paymentId: "pay-x", invoiceId: "inv-1", installmentId: "i4", amount: 500 }],
      }),
    ];
    const result = getPayableInstallments(invoice, local);
    expect(result.map((installment) => installment.id)).toEqual(["i4", "i3", "i2"]);
  });
});

describe("generatePaymentNumber / generateReceiptNumber", () => {
  it("produces sequential, zero-padded, prototype-illustrative references", () => {
    expect(generatePaymentNumber(6)).toBe("PAY-2026-0007");
    expect(generateReceiptNumber(6)).toBe("REC-2026-00506");
  });

  it("never collides with the seed fixtures' own REC-2026-003xx/004xx receipt range", () => {
    const receipt = generateReceiptNumber(0);
    expect(receipt.startsWith("REC-2026-005")).toBe(true);
  });
});
