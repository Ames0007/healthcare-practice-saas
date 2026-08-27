import type { CabinetExpense, Invoice, MoneyAmount, Payment } from "@/components/domain/finance/types";
import type { FinanceReportSummary } from "@/components/domain/reports/types";
import { computeFinanceKpis, type PeriodRange } from "@/features/finance/aggregations";

/** ISO `YYYY-MM-DD` strings compare correctly with plain string operators (mirrors `features/finance/aggregations.ts`'s own `isWithinRange`). */
function isWithinRange(dateIso: string, range: PeriodRange): boolean {
  return dateIso >= range.start && dateIso <= range.end;
}

/**
 * Period-scoped invoiced amount (Spec #1 §17.1 "Amount invoiced") — the
 * one figure `features/finance/aggregations.ts` does not already compute.
 * Mirrors `computeDisbursed`'s exact shape (filter by status + date range,
 * sum) and its own "cancelled invoices never count" rule
 * (`getFinancialSummary`'s convention) — never a second, differently-
 * scoped "total" for the same invoices.
 */
export function computeInvoiced(invoices: Invoice[], range: PeriodRange): MoneyAmount {
  return invoices
    .filter((invoice) => invoice.status !== "cancelled" && isWithinRange(invoice.issuedDate, range))
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
}

/**
 * Cabinet-wide financial report summary for the selected period (Spec #2
 * §42.2). Reuses `computeFinanceKpis` (UI-006A) unmodified for
 * collected/receivable/overdue — never a second, possibly-diverging
 * calculation of figures the Finance dashboard already owns. Only
 * `invoiced` and `collectionRatePercent` are new.
 *
 * "Revenue by service" (Spec #2 §42.2's own "by service" breakdown) is
 * deliberately NOT implemented: `Invoice` carries no `service`/service-id
 * field (only a free-text `description` and `lines[].label`), so any
 * join to Agenda's `SERVICES` catalog would require guessing a match from
 * free text — exactly the kind of unreliable derivation the task's own
 * "reports must derive from existing fixtures, never an independently
 * invented number" rule warns against. "Revenue by practitioner" IS
 * implemented (`buildPractitionerActivityRows`) since `Invoice.practitionerName`
 * is a real, reliable field.
 */
export function computeFinanceReportSummary(
  invoices: Invoice[],
  payments: Payment[],
  expenses: CabinetExpense[],
  range: PeriodRange,
): FinanceReportSummary {
  const { collected, receivable, overdue } = computeFinanceKpis(invoices, payments, expenses, range);
  const invoiced = computeInvoiced(invoices, range);
  const collectionRatePercent = invoiced > 0 ? Math.round((collected / invoiced) * 1000) / 10 : 0;

  return { invoiced, collected, receivable, overdue, collectionRatePercent };
}
