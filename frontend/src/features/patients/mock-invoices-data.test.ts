import { describe, expect, it } from "vitest";
import { getInvoicesMockData } from "./mock-invoices-data";
import { getFinancialSummary, getInvoicesForPatient } from "./finance";

describe("invoice fixture integrity (UI-004D §29)", () => {
  const invoices = getInvoicesMockData();

  it.each(invoices.filter((invoice) => invoice.status !== "cancelled"))(
    "paidAmount + remainingAmount === totalAmount for $invoiceNumber (24/25)",
    (invoice) => {
      expect(invoice.paidAmount + invoice.remainingAmount).toBe(invoice.totalAmount);
    },
  );

  it("documents the cancelled-invoice exception: remainingAmount is 0 regardless of totalAmount (§29)", () => {
    const cancelled = invoices.find((invoice) => invoice.status === "cancelled")!;
    expect(cancelled.remainingAmount).toBe(0);
    expect(cancelled.totalAmount).toBeGreaterThan(0);
  });

  it.each(invoices.filter((invoice) => invoice.installments.length > 0))(
    "sum(installment amounts) === totalAmount for $invoiceNumber (24)",
    (invoice) => {
      const sum = invoice.installments.reduce((total, installment) => total + installment.amount, 0);
      expect(sum).toBe(invoice.totalAmount);
    },
  );

  it.each(invoices.filter((invoice) => invoice.installments.length > 0))(
    "sum of paid installments === paidAmount for $invoiceNumber",
    (invoice) => {
      const paidSum = invoice.installments
        .filter((installment) => installment.status === "paid")
        .reduce((total, installment) => total + installment.amount, 0);
      expect(paidSum).toBe(invoice.paidAmount);
    },
  );

  it("aggregates pat-1's non-cancelled invoices to the task's own wireframe totals (§17)", () => {
    const summary = getFinancialSummary(getInvoicesForPatient(invoices, "pat-1"));
    expect(summary.totalAmount).toBe(4500);
    expect(summary.paidAmount).toBe(3000);
    expect(summary.remainingAmount).toBe(1500);
  });

  it("excludes the cancelled invoice from pat-1's aggregate but keeps it in the raw list", () => {
    const patientInvoices = getInvoicesForPatient(invoices, "pat-1");
    expect(patientInvoices.some((invoice) => invoice.status === "cancelled")).toBe(true);
  });
});
