import { describe, expect, it } from "vitest";
import { getInvoicesMockData } from "./mock-invoices-data";
import { getFinancialSummary, getInvoicesForPatient } from "./finance";
import { getEmptyPaymentsMockData, getPaymentsMockData } from "./mock-payments-data";
import { getAllocatedTotal, getEffectivePaidAmount, getPaymentsForPatient } from "./payments";

/**
 * Financial-integrity tests (UI-004E §7/§57) — proving the fixture data is
 * internally consistent, not merely that some text renders. These are the
 * load-bearing assertions for the "Financial Source-of-Truth Rule".
 */
describe("payment fixture integrity", () => {
  const payments = getPaymentsMockData();
  const invoices = getInvoicesMockData();

  it.each(payments)("$paymentNumber: allocations sum to the payment's own amount", (payment) => {
    expect(getAllocatedTotal(payment)).toBe(payment.amount);
  });

  it("every payment reference is unique", () => {
    const numbers = payments.map((payment) => payment.paymentNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("every receipt number is unique", () => {
    const receiptNumbers = payments.map((payment) => payment.receipt?.receiptNumber).filter((value): value is string => Boolean(value));
    expect(new Set(receiptNumbers).size).toBe(receiptNumbers.length);
  });

  it("a reversed payment has no receipt", () => {
    const reversed = payments.filter((payment) => payment.status === "reversed");
    expect(reversed.length).toBeGreaterThan(0);
    reversed.forEach((payment) => expect(payment.receipt).toBeUndefined());
  });

  it("every allocation references an existing invoice belonging to the same patient", () => {
    payments.forEach((payment) => {
      payment.allocations.forEach((allocation) => {
        const invoice = invoices.find((candidate) => candidate.id === allocation.invoiceId);
        expect(invoice).toBeDefined();
        expect(invoice?.patientId).toBe(payment.patientId);
      });
    });
  });

  it("every allocation's installmentId, when set, references an existing installment on that invoice", () => {
    payments.forEach((payment) => {
      payment.allocations.forEach((allocation) => {
        if (!allocation.installmentId) {
          return;
        }
        const invoice = invoices.find((candidate) => candidate.id === allocation.invoiceId);
        const installment = invoice?.installments.find((candidate) => candidate.id === allocation.installmentId);
        expect(installment).toBeDefined();
      });
    });
  });

  it("posted payment allocations reconcile exactly with each represented invoice's paidAmount", () => {
    const invoiceIdsWithHistory = new Set(payments.flatMap((payment) => payment.allocations.map((allocation) => allocation.invoiceId)));

    invoiceIdsWithHistory.forEach((invoiceId) => {
      const invoice = invoices.find((candidate) => candidate.id === invoiceId)!;
      const allocatedToInvoice = payments
        .filter((payment) => payment.status === "posted")
        .flatMap((payment) => payment.allocations)
        .filter((allocation) => allocation.invoiceId === invoiceId)
        .reduce((sum, allocation) => sum + allocation.amount, 0);

      expect(allocatedToInvoice).toBe(invoice.paidAmount);
    });
  });

  it("every paid installment has a matching posted-payment allocation of the exact same amount", () => {
    const paidAllocationsByInstallmentId = new Map(
      payments
        .filter((payment) => payment.status === "posted")
        .flatMap((payment) => payment.allocations)
        .filter((allocation) => allocation.installmentId)
        .map((allocation) => [allocation.installmentId as string, allocation.amount]),
    );

    invoices.forEach((invoice) => {
      invoice.installments
        .filter((installment) => installment.status === "paid")
        .forEach((installment) => {
          expect(paidAllocationsByInstallmentId.get(installment.id)).toBe(installment.amount);
        });
    });
  });

  it("the reversed payment (pat-9) does not count toward its invoice's still fully-overdue balance", () => {
    const inv3 = invoices.find((invoice) => invoice.id === "inv-3")!;
    expect(inv3.paidAmount).toBe(0);
    expect(getEffectivePaidAmount(getPaymentsForPatient(payments, "pat-9"))).toBe(0);
  });

  it("pat-1's effective collected total matches the non-cancelled invoice aggregate paidAmount from UI-004D's own fixtures", () => {
    const pat1Invoices = getInvoicesForPatient(invoices, "pat-1");
    const pat1Payments = getPaymentsForPatient(payments, "pat-1");

    expect(getEffectivePaidAmount(pat1Payments)).toBe(getFinancialSummary(pat1Invoices).paidAmount);
  });

  it("pat-4's effective collected total matches its invoice paidAmount", () => {
    const pat4Invoices = getInvoicesForPatient(invoices, "pat-4");
    const pat4Payments = getPaymentsForPatient(payments, "pat-4");

    expect(getEffectivePaidAmount(pat4Payments)).toBe(getFinancialSummary(pat4Invoices).paidAmount);
  });

  it("pat-2 (no-payment patient) has no payment history at all", () => {
    expect(getPaymentsForPatient(payments, "pat-2")).toEqual([]);
  });
});

describe("getEmptyPaymentsMockData", () => {
  it("returns an empty array for direct empty-state test injection", () => {
    expect(getEmptyPaymentsMockData()).toEqual([]);
  });
});
