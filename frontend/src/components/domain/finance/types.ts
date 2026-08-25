/**
 * Invoice/installment prototype model (UI-004D §10-12, Spec #4 §15-16).
 * Domain-owned, mirroring `domain/treatments/types.ts`.
 *
 * Money representation (UI-004D §8-9): whole MAD units (never fractional/
 * floating-point), matching `Patient.outstandingBalance`'s and
 * `formatMad`'s existing convention exactly — no fixture or wireframe
 * anywhere in this product ever shows centimes. This is deliberately NOT
 * a separate minor-units (×100) representation: introducing one here
 * would create two incompatible money models side by side and force a
 * wide refactor of `formatMad`/`Patient`/`PatientHeader`/`PatientOverview`,
 * which UI-004D's own instructions explicitly say to avoid ("or another
 * safe deterministic money representation consistent with existing
 * frontend architecture... do not perform a huge refactor"). All amounts
 * below are whole-number MAD, so ordinary integer arithmetic is already
 * float-free — the safety property CLAUDE.md §20 actually requires.
 */
export type MoneyAmount = number;

export type InvoiceStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";

export type InstallmentStatus = "paid" | "due" | "overdue" | "future";

export interface InvoiceLine {
  id: string;
  label: string;
  quantity: number;
  unitPriceAmount: MoneyAmount;
  totalAmount: MoneyAmount;
}

export interface Installment {
  id: string;
  invoiceId: string;
  sequenceNumber: number;
  dueDate: string;
  amount: MoneyAmount;
  status: InstallmentStatus;
  /** Set once paid — for installment #1 equal to the invoice's `issuedDate`, this doubles as the down-payment representation (UI-004D §30). */
  paidDate?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  invoiceNumber: string;
  issuedDate: string;
  status: InvoiceStatus;
  currency: "MAD";
  /** Short display label (Spec #9 Screen 25/26), e.g. "Traitement de rééducation" — distinct from the more detailed `lines`. */
  description: string;
  practitionerName: string;
  /** Cross-references `TreatmentPlan.id` (UI-004C) — looked up by the feature layer, never duplicated (CLAUDE.md §12). */
  treatmentPlanId?: string;
  totalAmount: MoneyAmount;
  paidAmount: MoneyAmount;
  remainingAmount: MoneyAmount;
  lines: InvoiceLine[];
  installments: Installment[];
}

/**
 * Payment/allocation/receipt prototype model (UI-004E §9-12, Spec #4 §17).
 * V1 patient payments are cash-only (CLAUDE.md §23) — no card/online method.
 */
export type PaymentMethod = "cash";

/**
 * Kept minimal per UI-004E §10: a posted payment is financially historical
 * (CLAUDE.md §24) and is never silently edited/deleted. "reversed" is a
 * separate documented historical event, not an interactive workflow this
 * prototype implements (UI-004E §37).
 */
export type PaymentStatus = "posted" | "reversed";

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  installmentId?: string;
  amount: MoneyAmount;
}

/** Human-facing reference, e.g. "REC-2026-00382" (Spec #4 §17.3) — never the internal payment id. */
export interface Receipt {
  id: string;
  receiptNumber: string;
  paymentId: string;
  issuedAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  paymentNumber: string;
  paymentDate: string;
  amount: MoneyAmount;
  method: PaymentMethod;
  status: PaymentStatus;
  /** One payment may in principle cover multiple invoices/installments (Spec #4 §17.2) — this prototype's capture UX always produces exactly one. */
  allocations: PaymentAllocation[];
  /** Absent for a reversed payment — a reversal has no valid receipt to print/download (UI-004E §35/§38). */
  receipt?: Receipt;
  /** Set only when `status` is "reversed" — documents why the payment no longer counts toward collected totals. */
  reversalReason?: string;
}
