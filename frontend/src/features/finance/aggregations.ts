import { addDaysIso, getWeekStart } from "@/features/agenda/format";
import { getFinancialSummary } from "@/features/patients/finance";
import { getEffectivePaidAmount } from "@/features/patients/payments";
import { getPatientFullName } from "@/features/patients/format";
import type { CabinetExpense, Invoice, InvoiceStatus, MoneyAmount, Payment } from "@/components/domain/finance/types";
import type { Patient } from "@/features/patients/types";
import type { FinanceKpis, FinancePeriod, FinancialActivity, ReceivableItem } from "./types";

export interface PeriodRange {
  start: string;
  end: string;
}

/**
 * Deterministic prototype period boundaries (UI-006A §15-16), resolved
 * against the fixed `businessDate` convention already used by
 * Aujourd'hui/Agenda (`MOCK_BUSINESS_DATE`) rather than the real client
 * clock. "week" reuses Agenda's own Monday-start `getWeekStart` (UI-002)
 * instead of a second week-boundary rule.
 */
export function getPeriodRange(period: FinancePeriod, businessDate: string): PeriodRange {
  if (period === "today") {
    return { start: businessDate, end: businessDate };
  }
  if (period === "week") {
    const start = getWeekStart(businessDate);
    return { start, end: addDaysIso(start, 6) };
  }

  const [year, month] = businessDate.split("-");
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  return { start: `${year}-${month}-01`, end: `${year}-${month}-${String(daysInMonth).padStart(2, "0")}` };
}

/** ISO `YYYY-MM-DD` strings compare correctly with plain string operators. */
function isWithinRange(dateIso: string, range: PeriodRange): boolean {
  return dateIso >= range.start && dateIso <= range.end;
}

/**
 * Constant synthetic seed (UI-006A §12/§40), matching Spec #9 Screen 30's
 * own illustrative "Solde initial" value (500 MAD) rather than an invented
 * number. Reused unchanged across all three period views since this
 * dashboard does not implement real Caisse session boundaries (UI-006C/E
 * own opening/closing) — a documented prototype projection only (§41), not
 * a running real balance.
 */
export const OPENING_CASH_POSITION: MoneyAmount = 500;

/**
 * Effective posted cash payments within the period (UI-006A §18/§37).
 * Reuses `getEffectivePaidAmount`'s exact reversed-payment-exclusion rule
 * (UI-004E) unmodified after filtering to the period — never a second,
 * possibly-diverging "collected" calculation.
 */
export function computeCollected(payments: Payment[], range: PeriodRange): MoneyAmount {
  return getEffectivePaidAmount(payments.filter((payment) => isWithinRange(payment.paymentDate, range)));
}

/**
 * Outstanding valid invoice balance / overdue balance (UI-006A §18/§36/§38).
 * Deliberately NOT period-scoped — these are current balances, not activity
 * that occurred during a window, so they stay constant across Today/Week/
 * Month (only Encaissé/Décaissements/Position Caisse change with period).
 * Reuses `getFinancialSummary` (UI-004D) unmodified across the full
 * cabinet-wide invoice set (UI-006A §10) so this can never independently
 * contradict Patient 360°'s own figures.
 */
export function computeReceivableAndOverdue(invoices: Invoice[]): { receivable: MoneyAmount; overdue: MoneyAmount } {
  const summary = getFinancialSummary(invoices);
  return { receivable: summary.remainingAmount, overdue: summary.overdueAmount };
}

/** Valid (non-cancelled) synthetic cabinet expenses within the period (UI-006A §18/§39). */
export function computeDisbursed(expenses: CabinetExpense[], range: PeriodRange): MoneyAmount {
  return expenses
    .filter((expense) => expense.status === "posted" && isWithinRange(expense.date, range))
    .reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Generic cash-flow balance primitive (UI-006C §43 refactor) shared by the
 * Finance dashboard's Position Caisse below and Caisse's own theoretical
 * balance (`features/caisse/calculations.ts`) — opening + incoming −
 * outgoing. The two callers deliberately keep distinct semantics: this
 * dashboard's "opening" is the constant `OPENING_CASH_POSITION` reused
 * across all three period views (a documented projection, §41), while
 * Caisse's "opening" is the real amount entered when today's specific
 * `CashSession` was opened. Extracting the shared arithmetic here avoids
 * two copies of the same one-line formula without pretending the two
 * "opening" values mean the same thing.
 */
export function computeCashBalance(opening: MoneyAmount, incoming: MoneyAmount, outgoing: MoneyAmount): MoneyAmount {
  return opening + incoming - outgoing;
}

/** Prototype cash-position formula (UI-006A §40): opening position + period collections − period disbursements. */
export function computeCashPosition(collected: MoneyAmount, disbursed: MoneyAmount): MoneyAmount {
  return computeCashBalance(OPENING_CASH_POSITION, collected, disbursed);
}

export function computeFinanceKpis(
  invoices: Invoice[],
  payments: Payment[],
  expenses: CabinetExpense[],
  range: PeriodRange,
): FinanceKpis {
  const collected = computeCollected(payments, range);
  const disbursed = computeDisbursed(expenses, range);
  const { receivable, overdue } = computeReceivableAndOverdue(invoices);

  return { collected, receivable, overdue, disbursed, cashPosition: computeCashPosition(collected, disbursed) };
}

/** Operational priority (UI-006A §22): overdue first, then currently due, then any other outstanding status. */
const RECEIVABLE_RANK: Partial<Record<InvoiceStatus, number>> = { overdue: 0, partially_paid: 1, issued: 1 };

function findEarliestUnpaidDueDate(invoice: Invoice): string | undefined {
  const unpaid = invoice.installments.filter((installment) => installment.status !== "paid");
  if (unpaid.length === 0) {
    return undefined;
  }
  return unpaid.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0].dueDate;
}

/**
 * Cabinet-wide receivables (UI-006A §21-23) resolved to display-ready
 * patient names, operationally ordered — never fixture insertion order.
 */
export function buildReceivables(invoices: Invoice[], patients: Patient[]): ReceivableItem[] {
  const nameById = new Map(patients.map((patient) => [patient.id, getPatientFullName(patient)]));

  return invoices
    .filter((invoice) => invoice.status !== "cancelled" && invoice.remainingAmount > 0)
    .map((invoice) => ({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: nameById.get(invoice.patientId) ?? invoice.patientId,
      remainingAmount: invoice.remainingAmount,
      status: invoice.status,
      dueDate: findEarliestUnpaidDueDate(invoice),
    }))
    .sort((a, b) => {
      const rankDiff = (RECEIVABLE_RANK[a.status] ?? 2) - (RECEIVABLE_RANK[b.status] ?? 2);
      return rankDiff !== 0 ? rankDiff : (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    });
}

/**
 * Cabinet-wide recent activity for the period (UI-006A §29-32): posted
 * payments + posted expenses only, newest first. Neither source fixture
 * tracks a time-of-day, so `FinancialActivity` intentionally carries none
 * rather than inventing one.
 */
export function buildRecentActivity(
  payments: Payment[],
  expenses: CabinetExpense[],
  invoices: Invoice[],
  patients: Patient[],
  range: PeriodRange,
): FinancialActivity[] {
  const nameById = new Map(patients.map((patient) => [patient.id, getPatientFullName(patient)]));
  const invoiceNumberById = new Map(invoices.map((invoice) => [invoice.id, invoice.invoiceNumber]));

  const paymentActivity: FinancialActivity[] = payments
    .filter((payment) => payment.status === "posted" && isWithinRange(payment.paymentDate, range))
    .map((payment) => {
      const invoiceId = payment.allocations[0]?.invoiceId;
      return {
        id: payment.id,
        type: "payment",
        date: payment.paymentDate,
        label: nameById.get(payment.patientId) ?? payment.patientId,
        invoiceNumber: invoiceId ? invoiceNumberById.get(invoiceId) : undefined,
        amount: payment.amount,
        direction: "in",
        patientId: payment.patientId,
        invoiceId,
      };
    });

  const expenseActivity: FinancialActivity[] = expenses
    .filter((expense) => expense.status === "posted" && isWithinRange(expense.date, range))
    .map((expense) => ({
      id: expense.id,
      type: "expense",
      date: expense.date,
      label: expense.label,
      category: expense.category,
      amount: expense.amount,
      direction: "out",
    }));

  return [...paymentActivity, ...expenseActivity].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    return byDate !== 0 ? byDate : a.id.localeCompare(b.id);
  });
}
