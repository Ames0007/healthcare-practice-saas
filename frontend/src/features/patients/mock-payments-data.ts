import type { Payment } from "@/components/domain/finance/types";

/**
 * Centralized synthetic payment/allocation/receipt fixtures (UI-004E §13-14).
 * Every posted payment's allocations reconcile exactly with the invoice
 * fixtures in `mock-invoices-data.ts` (UI-004E §7 — Financial Source-of-Truth
 * Rule): `pay-3` + `pay-5` + `pay-6` (500 each) account for exactly inv-1's
 * 1 500 MAD `paidAmount` (its three paid installments); `pay-2` accounts for
 * inv-1b's 1 500 MAD; `pay-1` accounts for inv-2's 800 MAD. `pay-4` (Mehdi,
 * pat-9) is the one deliberately reversed payment (§14): it never reduced
 * inv-3's balance, which is why inv-3 still shows the full 2 200 MAD
 * outstanding/overdue in UI-004D's own fixtures — the reversal is what
 * explains that state, not an oversight. Sara/pat-2 deliberately has none at
 * all (no-payment patient, UI-004E §14).
 *
 * Receipt/payment numbering is sequential and chronological across the
 * fixture set (Spec #4 §17.1/§17.3 uniqueness), purely illustrative — real
 * numbering is concurrency-safe and server-controlled (UI-004E §32).
 */
export function getPaymentsMockData(): Payment[] {
  return [
    {
      id: "pay-1",
      patientId: "pat-4",
      paymentNumber: "PAY-2026-0001",
      paymentDate: "2026-07-10",
      amount: 800,
      method: "cash",
      status: "posted",
      allocations: [{ id: "pay-1-a1", paymentId: "pay-1", invoiceId: "inv-2", amount: 800 }],
      receipt: { id: "rec-1", receiptNumber: "REC-2026-00340", paymentId: "pay-1", issuedAt: "2026-07-10" },
    },
    {
      id: "pay-2",
      patientId: "pat-1",
      paymentNumber: "PAY-2026-0002",
      paymentDate: "2026-07-15",
      amount: 1500,
      method: "cash",
      status: "posted",
      allocations: [{ id: "pay-2-a1", paymentId: "pay-2", invoiceId: "inv-1b", amount: 1500 }],
      receipt: { id: "rec-2", receiptNumber: "REC-2026-00350", paymentId: "pay-2", issuedAt: "2026-07-15" },
    },
    {
      id: "pay-3",
      patientId: "pat-1",
      paymentNumber: "PAY-2026-0003",
      paymentDate: "2026-08-01",
      amount: 500,
      method: "cash",
      status: "posted",
      allocations: [{ id: "pay-3-a1", paymentId: "pay-3", invoiceId: "inv-1", installmentId: "inv-1-i1", amount: 500 }],
      receipt: { id: "rec-3", receiptNumber: "REC-2026-00380", paymentId: "pay-3", issuedAt: "2026-08-01" },
    },
    {
      // Deliberate reversed-payment representation (UI-004E §14/§37): posted
      // then later reversed, so it never counted toward inv-3's paidAmount —
      // consistent with inv-3 still showing 2 200 MAD fully overdue.
      id: "pay-4",
      patientId: "pat-9",
      paymentNumber: "PAY-2026-0004",
      paymentDate: "2026-08-05",
      amount: 2200,
      method: "cash",
      status: "reversed",
      allocations: [{ id: "pay-4-a1", paymentId: "pay-4", invoiceId: "inv-3", installmentId: "inv-3-i1", amount: 2200 }],
      reversalReason: "Paiement annulé — erreur de saisie.",
    },
    {
      id: "pay-5",
      patientId: "pat-1",
      paymentNumber: "PAY-2026-0005",
      paymentDate: "2026-08-15",
      amount: 500,
      method: "cash",
      status: "posted",
      allocations: [{ id: "pay-5-a1", paymentId: "pay-5", invoiceId: "inv-1", installmentId: "inv-1-i2", amount: 500 }],
      receipt: { id: "rec-5", receiptNumber: "REC-2026-00381", paymentId: "pay-5", issuedAt: "2026-08-15" },
    },
    {
      id: "pay-6",
      patientId: "pat-1",
      paymentNumber: "PAY-2026-0006",
      paymentDate: "2026-08-22",
      amount: 500,
      method: "cash",
      status: "posted",
      allocations: [{ id: "pay-6-a1", paymentId: "pay-6", invoiceId: "inv-1", installmentId: "inv-1-i3", amount: 500 }],
      receipt: { id: "rec-6", receiptNumber: "REC-2026-00382", paymentId: "pay-6", issuedAt: "2026-08-22" },
    },
  ];
}

export function getEmptyPaymentsMockData(): Payment[] {
  return [];
}
