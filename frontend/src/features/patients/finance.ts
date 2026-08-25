import type { Installment, Invoice } from "@/components/domain/finance/types";

export function getInvoicesForPatient(invoices: Invoice[], patientId: string): Invoice[] {
  return invoices.filter((invoice) => invoice.patientId === patientId);
}

export type InvoiceFilterGroup = "all" | "due" | "paid" | "overdue";

/** Cancelled/draft invoices remain visible only under "all" (UI-004D §38). */
export function matchesInvoiceFilter(invoice: Invoice, group: InvoiceFilterGroup): boolean {
  switch (group) {
    case "all":
      return true;
    case "due":
      return invoice.status === "issued" || invoice.status === "partially_paid";
    case "paid":
      return invoice.status === "paid";
    case "overdue":
      return invoice.status === "overdue";
  }
}

export interface FinancialSummary {
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  overdueAmount: number;
}

/** Cancelled invoices are excluded from the aggregate (a voided invoice was never really "facturé") but stay visible in the list itself. */
export function getFinancialSummary(invoices: Invoice[]): FinancialSummary {
  const active = invoices.filter((invoice) => invoice.status !== "cancelled");

  return {
    totalAmount: active.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    paidAmount: active.reduce((sum, invoice) => sum + invoice.paidAmount, 0),
    remainingAmount: active.reduce((sum, invoice) => sum + invoice.remainingAmount, 0),
    overdueAmount: active
      .filter((invoice) => invoice.status === "overdue")
      .reduce((sum, invoice) => sum + invoice.remainingAmount, 0),
  };
}

/** "Prochaine échéance" — the most urgent unpaid installment across all of a patient's invoices: the earliest overdue one, else the earliest due one, else none (future-only installments are not yet actionable). */
export function findNextInstallment(invoices: Invoice[]): Installment | null {
  const all = invoices.flatMap((invoice) => invoice.installments);
  const overdue = all.filter((installment) => installment.status === "overdue").sort(compareByDueDate);
  if (overdue.length > 0) {
    return overdue[0];
  }

  const due = all.filter((installment) => installment.status === "due").sort(compareByDueDate);
  return due[0] ?? null;
}

function compareByDueDate(a: Installment, b: Installment): number {
  return a.dueDate.localeCompare(b.dueDate);
}

export interface PatientFinancialSummary {
  outstandingBalance: number;
  nextInstallment: { amount: number; dueDate: string } | null;
}

/**
 * Derives the Patient Overview/Header financial summary from these same
 * invoice fixtures (UI-004D §15-16) instead of a hand-typed number — but
 * only for patients who actually have invoice fixtures here. Returns
 * `null` for every other patient so the caller falls back to
 * `Patient.outstandingBalance` unchanged; this deliberately avoids a
 * wide refactor of the 12 seed patients this task did not add invoices
 * for.
 */
export function getPatientFinancialSummary(invoices: Invoice[], patientId: string): PatientFinancialSummary | null {
  const patientInvoices = getInvoicesForPatient(invoices, patientId);
  if (patientInvoices.length === 0) {
    return null;
  }

  const { remainingAmount } = getFinancialSummary(patientInvoices);
  const next = findNextInstallment(patientInvoices);

  return {
    outstandingBalance: remainingAmount,
    nextInstallment: next ? { amount: next.amount, dueDate: next.dueDate } : null,
  };
}
