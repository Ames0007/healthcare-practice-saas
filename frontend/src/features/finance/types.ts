import type { ExpenseCategory, InvoiceStatus, MoneyAmount } from "@/components/domain/finance/types";

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
  /** Prototype operational cash position: opening position + period collected − period disbursed (UI-006A §18/§40). */
  cashPosition: MoneyAmount;
}
