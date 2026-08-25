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

/**
 * Read-only synthetic cabinet expense/décaissement (UI-006A §11), a sibling
 * finance-domain concept to Invoice/Payment. Supports only the cabinet
 * Finance dashboard's Décaissements KPI and recent-activity aggregation —
 * this is not a real expense-entry domain model (no create/edit/delete
 * anywhere in this prototype); UI-006D owns that.
 */
export type ExpenseCategory = "supplies" | "utilities" | "services" | "other";

/**
 * Kept shape-symmetric with `PaymentStatus` for a future real Décaissements
 * module, mirroring the same deliberate-future-proofing convention used by
 * UI-005D's `PrescriptionStatus`. This prototype only ever seeds "posted"
 * expenses plus one deliberately "cancelled" one to prove exclusion from
 * every aggregate (CLAUDE.md §27, UI-006A §36-39) — no cancellation
 * workflow exists here.
 */
export type ExpenseStatus = "posted" | "cancelled";

export interface CabinetExpense {
  id: string;
  date: string;
  label: string;
  category: ExpenseCategory;
  amount: MoneyAmount;
  status: ExpenseStatus;
}

/**
 * Caisse domain (UI-006C, Spec #4 §18) — simplified frontend prototype of
 * `cash_register_sessions`. Deliberately omits
 * `expected_closing_balance`/`physical_closing_balance`/`difference_*`/
 * `closed_by`/`closed_at` (UI-006E's own scope, not harmless to model half
 * here) and narrows `status` to exactly the two values this task uses —
 * the backend ENUM(open, closed) already matches 1:1, so no reconciliation
 * is needed later.
 */
export type CashSessionStatus = "closed" | "open";

export interface CashSession {
  id: string;
  businessDate: string;
  status: CashSessionStatus;
  /** Set only once opened — deterministic prototype value (UI-006C §22), never `Date.now()`. */
  openedAt?: string;
  openedBy?: string;
  openingBalance: MoneyAmount;
}

export type CashMovementDirection = "in" | "out";

/**
 * Narrowed from Spec #4 §18.2's `source_type` ENUM(patient_payment,
 * expense, correction, manual_authorized) to the two this prototype
 * actually derives — no manual/correction movement creation anywhere in
 * this task (§34).
 */
export type CashMovementType = "patient_payment" | "expense";

/**
 * Simplified frontend prototype of `cash_movements` (Spec #4 §18.2).
 * Always derived from an existing `Payment`/`CabinetExpense` record — see
 * `features/caisse/calculations.ts` — never independently authored.
 */
export interface CashMovement {
  id: string;
  cashSessionId: string;
  /** Synthetic prototype time-of-day (`HH:MM`) — neither `Payment` nor `CabinetExpense` tracks real time, only date (UI-006C §22/§27). */
  occurredAt: string;
  direction: CashMovementDirection;
  type: CashMovementType;
  amount: MoneyAmount;
  label: string;
  /** Receipt/payment reference, set only for `type: "patient_payment"`. */
  reference?: string;
  patientId?: string;
  paymentId?: string;
  expenseId?: string;
}
