import { getPayableInstallments } from "@/features/patients/payments";
import { getPatientFullName } from "@/features/patients/format";
import type { Installment, Invoice, InvoiceStatus } from "@/components/domain/finance/types";
import type { Patient } from "@/features/patients/types";
import type { GlobalInvoiceFilterGroup, GlobalInvoiceRow } from "./types";

/**
 * Operational priority (UI-006B §18): one tier per `InvoiceStatus` value —
 * overdue first, then currently issued/outstanding, then partially paid
 * (still requires collection), then draft ("future outstanding" — not yet
 * billed), then paid, then cancelled last. Never fixture insertion order.
 */
const GLOBAL_PRIORITY_RANK: Record<InvoiceStatus, number> = {
  overdue: 0,
  issued: 1,
  partially_paid: 2,
  draft: 3,
  paid: 4,
  cancelled: 5,
};

/** Reuses `getPayableInstallments` (UI-004E) unmodified with no local payments — this is a read-only cabinet view, never a payment-capture session. */
function findNextInstallmentForInvoice(invoice: Invoice): Installment | null {
  return getPayableInstallments(invoice, [])[0] ?? null;
}

/** Resolves every cabinet invoice to a display-ready row, operationally ordered (UI-006B §8/§18). */
export function buildGlobalInvoiceRows(invoices: Invoice[], patients: Patient[]): GlobalInvoiceRow[] {
  const patientById = new Map(patients.map((patient) => [patient.id, patient]));

  const rows: GlobalInvoiceRow[] = invoices.map((invoice) => {
    const patient = patientById.get(invoice.patientId);

    return {
      invoice,
      patientId: invoice.patientId,
      patientName: patient ? getPatientFullName(patient) : invoice.patientId,
      patientNumber: patient?.patientNumber ?? "",
      nextInstallment: findNextInstallmentForInvoice(invoice),
      operationalPriority: GLOBAL_PRIORITY_RANK[invoice.status],
    };
  });

  return rows.sort(compareOperationally);
}

/**
 * Within the same priority tier: the earliest relevant due date first (the
 * next installment's due date when one exists), else the most recently
 * issued invoice first — the fallback tiers (draft/paid/cancelled) have no
 * meaningful due date, so recency stands in for urgency there (UI-006B §18).
 */
function compareOperationally(a: GlobalInvoiceRow, b: GlobalInvoiceRow): number {
  if (a.operationalPriority !== b.operationalPriority) {
    return a.operationalPriority - b.operationalPriority;
  }

  const aDue = a.nextInstallment?.dueDate;
  const bDue = b.nextInstallment?.dueDate;
  if (aDue && bDue) {
    return aDue.localeCompare(bDue);
  }
  if (aDue) {
    return -1;
  }
  if (bDue) {
    return 1;
  }

  return b.invoice.issuedDate.localeCompare(a.invoice.issuedDate);
}

/** Case-insensitive local search across patient name, patient number and invoice number (UI-006B §12). */
export function matchesGlobalInvoiceSearch(row: GlobalInvoiceRow, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (query === "") {
    return true;
  }

  return (
    row.patientName.toLowerCase().includes(query) ||
    row.patientNumber.toLowerCase().includes(query) ||
    row.invoice.invoiceNumber.toLowerCase().includes(query)
  );
}

/** Bounded status filter (UI-006B §13-14) — "all" deliberately keeps cancelled invoices visible/accessible. */
export function matchesGlobalInvoiceFilter(row: GlobalInvoiceRow, group: GlobalInvoiceFilterGroup): boolean {
  switch (group) {
    case "all":
      return true;
    case "toPay":
      return row.invoice.status === "issued" && row.invoice.remainingAmount > 0;
    case "partial":
      return row.invoice.status === "partially_paid";
    case "paid":
      return row.invoice.status === "paid";
    case "overdue":
      return row.invoice.status === "overdue";
  }
}
