import type { ExpenseCategory, Installment, Invoice, InvoiceStatus, MoneyAmount } from "@/components/domain/finance/types";

export type FinancePeriod = "today" | "week" | "month";

export type FinancialActivityType = "payment" | "expense";

/**
 * Derived cabinet-level read model (UI-006A §30) merging posted payments and
 * posted expenses for the "Activité récente" list — never a ledger/journal
 * entry (CLAUDE.md §55). `invoiceNumber` is set only for a payment activity
 * whose allocation resolves to a known invoice; `category` is set only for
 * expense activity.
 */
export interface FinancialActivity {
  id: string;
  type: FinancialActivityType;
  date: string;
  label: string;
  invoiceNumber?: string;
  category?: ExpenseCategory;
  amount: MoneyAmount;
  direction: "in" | "out";
  patientId?: string;
  invoiceId?: string;
}

/** Cabinet-wide outstanding invoice, resolved to a display-ready patient name (UI-006A §21/§23). */
export interface ReceivableItem {
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  remainingAmount: MoneyAmount;
  status: InvoiceStatus;
  /** Earliest unpaid installment due date, when the invoice has a staged schedule. */
  dueDate?: string;
}

export interface FinanceKpis {
  /** Effective posted cash payments during the selected period (UI-006A §18). */
  collected: MoneyAmount;
  /** Outstanding valid (non-cancelled) invoice balance — not period-scoped (UI-006A §18). */
  receivable: MoneyAmount;
  /** Outstanding overdue invoice/installment amount — not period-scoped (UI-006A §18). */
  overdue: MoneyAmount;
  /** Valid synthetic cabinet expenses during the selected period (UI-006A §18). */
  disbursed: MoneyAmount;
}

/**
 * Global Finance invoice-status filter taxonomy (UI-006B §13-14) —
 * deliberately distinct from `features/patients/finance.ts`'s own
 * `InvoiceFilterGroup` (which merges issued+partially_paid into one "due"
 * bucket for the patient-scoped Factures tab). This screen's own task
 * instructions require splitting those into two separate filters, so this
 * is a second, explicitly-scoped mapping over the same `InvoiceStatus` —
 * not duplicated status logic, just a different screen's own taxonomy.
 */
export type GlobalInvoiceFilterGroup = "all" | "toPay" | "partial" | "paid" | "overdue";

/**
 * Cabinet-wide invoice row (UI-006B §8), resolved to display-ready patient
 * identity plus the next payable installment. Deliberately keeps the full
 * `Invoice` embedded rather than flattening total/paid/remaining onto the
 * row — a table cell reads `row.invoice.totalAmount` etc. directly, so
 * there is never a second, possibly-stale copy of those figures.
 */
export interface GlobalInvoiceRow {
  invoice: Invoice;
  patientId: string;
  patientName: string;
  patientNumber: string;
  /** The next not-yet-paid installment for this invoice, when it has a staged schedule (UI-006B §27-28). */
  nextInstallment: Installment | null;
  /** Lower = more operationally urgent (UI-006B §18) — one rank per `InvoiceStatus` value. */
  operationalPriority: number;
}
