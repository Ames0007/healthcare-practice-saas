import type { Installment, Invoice, Payment } from "@/components/domain/finance/types";

export function getPaymentsForPatient(payments: Payment[], patientId: string): Payment[] {
  return payments.filter((payment) => payment.patientId === patientId);
}

export function sortPaymentsDesc(payments: Payment[]): Payment[] {
  return payments.slice().sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
}

/** A payment's own allocations always sum to its `amount` in this prototype (one allocation per payment, UI-004E §57). */
export function getAllocatedTotal(payment: Payment): number {
  return payment.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
}

/** Reversed payments never count toward collected totals — a reversal is a separate historical event, not a silent edit (CLAUDE.md §24). */
export function getEffectivePaidAmount(payments: Payment[]): number {
  return payments
    .filter((payment) => payment.status === "posted")
    .reduce((sum, payment) => sum + payment.amount, 0);
}

export interface PaymentSummary {
  totalCollected: number;
  paymentCount: number;
  lastPaymentDate: string | null;
}

/** Reversed payments are excluded from every summary figure but remain visible in the history list itself (audit trail, CLAUDE.md §24). */
export function getPaymentSummary(payments: Payment[]): PaymentSummary {
  const posted = payments.filter((payment) => payment.status === "posted");
  const sorted = sortPaymentsDesc(posted);

  return {
    totalCollected: getEffectivePaidAmount(payments),
    paymentCount: posted.length,
    lastPaymentDate: sorted[0]?.paymentDate ?? null,
  };
}

/**
 * Recomputes each invoice's remaining balance after subtracting only this
 * session's newly captured payments (`localPayments`) — the seed invoice
 * fixtures already account for the seed payment history, so seed payments
 * must never be subtracted again here (UI-004E §7/§33). The invoice
 * fixtures themselves are never mutated.
 */
export function computeEffectiveRemaining(invoices: Invoice[], localPayments: Payment[]): Map<string, number> {
  const remaining = new Map(invoices.map((invoice) => [invoice.id, invoice.remainingAmount]));

  for (const payment of localPayments) {
    if (payment.status !== "posted") {
      continue;
    }
    for (const allocation of payment.allocations) {
      const current = remaining.get(allocation.invoiceId);
      if (current !== undefined) {
        remaining.set(allocation.invoiceId, current - allocation.amount);
      }
    }
  }

  return remaining;
}

/** Invoices a new payment can be allocated to: non-cancelled, with a positive effective remaining balance (UI-004E §26), oldest-issued first (§28). */
export function getAllocatableInvoices(invoices: Invoice[], effectiveRemainingByInvoiceId: Map<string, number>): Invoice[] {
  return invoices
    .filter((invoice) => invoice.status !== "cancelled" && (effectiveRemainingByInvoiceId.get(invoice.id) ?? invoice.remainingAmount) > 0)
    .sort((a, b) => a.issuedDate.localeCompare(b.issuedDate));
}

const INSTALLMENT_RANK: Record<Installment["status"], number> = { overdue: 0, due: 1, future: 2, paid: 3 };

/**
 * Installments not yet paid — in the seed fixture or locally this session —
 * for a given invoice, overdue-first then earliest due date (UI-004E
 * §27-28). Never returns an already-paid installment as a payment target.
 */
export function getPayableInstallments(invoice: Invoice, localPayments: Payment[]): Installment[] {
  const locallyPaidInstallmentIds = new Set(
    localPayments
      .filter((payment) => payment.status === "posted")
      .flatMap((payment) => payment.allocations)
      .filter((allocation) => allocation.installmentId)
      .map((allocation) => allocation.installmentId as string),
  );

  return invoice.installments
    .filter((installment) => installment.status !== "paid" && !locallyPaidInstallmentIds.has(installment.id))
    .sort((a, b) => {
      const byRank = INSTALLMENT_RANK[a.status] - INSTALLMENT_RANK[b.status];
      return byRank !== 0 ? byRank : a.dueDate.localeCompare(b.dueDate);
    });
}

/** Illustrative sequential prototype numbering only — real numbering is concurrency-safe and server-controlled (UI-004E §32). */
export function generatePaymentNumber(existingCount: number): string {
  return `PAY-2026-${String(existingCount + 1).padStart(4, "0")}`;
}

/** Deliberately offset from the seed fixtures' own REC-2026-003xx/004xx range to avoid an accidental collision in this prototype (UI-004E §32). */
export function generateReceiptNumber(existingCount: number): string {
  return `REC-2026-${String(500 + existingCount).padStart(5, "0")}`;
}
