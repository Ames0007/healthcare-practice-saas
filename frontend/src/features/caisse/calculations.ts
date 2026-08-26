import { computeCashBalance } from "@/features/finance/aggregations";
import { getPatientFullName } from "@/features/patients/format";
import type { CabinetExpense, CashDifferenceType, CashMovement, MoneyAmount, Payment } from "@/components/domain/finance/types";
import type { Patient } from "@/features/patients/types";

/**
 * Synthetic prototype time-of-day (UI-006C §22/§27) — neither `Payment`
 * nor `CabinetExpense` tracks a real time, only a date, so a deterministic
 * value is generated per movement instead of inventing per-fixture times
 * by hand (which would silently break for any future fixture added
 * without a matching entry). Movements are ordered by a stable key first
 * (type then id) so the same input always produces the same times.
 */
const SYNTHETIC_TIME_BASE_MINUTES = 8 * 60 + 30; // 08:30
const SYNTHETIC_TIME_STEP_MINUTES = 27;

function syntheticTimeForIndex(index: number): string {
  const totalMinutes = SYNTHETIC_TIME_BASE_MINUTES + index * SYNTHETIC_TIME_STEP_MINUTES;
  const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

interface MovementCandidate {
  sortKey: string;
  build: (occurredAt: string) => CashMovement;
}

/**
 * Derives today's Caisse movement history from the *existing* Payment/
 * CabinetExpense fixtures (UI-006C §12/§14) — never a second, independently
 * authored movement universe. Only posted, cash-method payments and posted
 * expenses dated exactly `businessDate` are included (§13/§15/§31):
 * reversed payments and cancelled expenses never contribute, and movements
 * from other days never leak into today's register.
 *
 * UI-006A's `CabinetExpense` has no `paymentMethod` field yet (a
 * deliberate UI-006A-era simplification — it was seeded purely as a small
 * operational cash-adjacent set) — until UI-006D introduces one, every
 * posted expense here is treated as cash-relevant.
 */
export function buildCashMovements(
  payments: Payment[],
  expenses: CabinetExpense[],
  patients: Patient[],
  cashSessionId: string,
  businessDate: string,
): CashMovement[] {
  const nameById = new Map(patients.map((patient) => [patient.id, getPatientFullName(patient)]));

  const paymentCandidates: MovementCandidate[] = payments
    .filter((payment) => payment.status === "posted" && payment.method === "cash" && payment.paymentDate === businessDate)
    .map((payment) => ({
      sortKey: `payment-${payment.id}`,
      build: (occurredAt: string): CashMovement => ({
        id: `mv-${payment.id}`,
        cashSessionId,
        occurredAt,
        direction: "in",
        type: "patient_payment",
        amount: payment.amount,
        label: nameById.get(payment.patientId) ?? payment.patientId,
        reference: payment.receipt?.receiptNumber ?? payment.paymentNumber,
        patientId: payment.patientId,
        paymentId: payment.id,
      }),
    }));

  const expenseCandidates: MovementCandidate[] = expenses
    .filter((expense) => expense.status === "posted" && expense.date === businessDate)
    .map((expense) => ({
      sortKey: `expense-${expense.id}`,
      build: (occurredAt: string): CashMovement => ({
        id: `mv-${expense.id}`,
        cashSessionId,
        occurredAt,
        direction: "out",
        type: "expense",
        amount: expense.amount,
        label: expense.label,
        expenseId: expense.id,
      }),
    }));

  const orderedCandidates = [...paymentCandidates, ...expenseCandidates].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  const movements = orderedCandidates.map((candidate, index) => candidate.build(syntheticTimeForIndex(index)));

  // Newest first (UI-006C §30) — time descending, id as a stable tiebreak.
  return movements.sort((a, b) => {
    const byTime = b.occurredAt.localeCompare(a.occurredAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}

export function computeIncomingTotal(movements: CashMovement[]): MoneyAmount {
  return movements.filter((movement) => movement.direction === "in").reduce((sum, movement) => sum + movement.amount, 0);
}

export function computeOutgoingTotal(movements: CashMovement[]): MoneyAmount {
  return movements.filter((movement) => movement.direction === "out").reduce((sum, movement) => sum + movement.amount, 0);
}

/**
 * Theoretical balance (UI-006C §24): opening balance + valid cash inflows
 * − valid cash outflows. This is the calculated figure only — UI-006C
 * never knows the physically counted amount (§25, UI-006E's own scope).
 * Reuses the same `computeCashBalance` primitive as the Finance
 * dashboard's Position Caisse (UI-006A) — see that function's own doc
 * comment for the documented semantic difference between the two
 * "opening" values.
 */
export function computeTheoreticalBalance(openingBalance: MoneyAmount, incoming: MoneyAmount, outgoing: MoneyAmount): MoneyAmount {
  return computeCashBalance(openingBalance, incoming, outgoing);
}

/** Whole-MAD, non-negative (UI-006C §19) — mirrors the rest of this codebase's float-free money discipline (CLAUDE.md §20). */
export function isValidOpeningBalance(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Closing-time cash difference (UI-006E §13 — CRITICAL, do not reverse the
 * operands): the physically counted amount minus what was expected. A
 * shortfall (counted less than expected) is negative; an excess is
 * positive.
 */
export function computeCashDifference(physicalClosingBalance: MoneyAmount, expectedClosingBalance: MoneyAmount): MoneyAmount {
  return physicalClosingBalance - expectedClosingBalance;
}

/** 0 → balanced, negative → shortage, positive → overage (UI-006E §14). */
export function resolveCashDifferenceType(differenceAmount: MoneyAmount): CashDifferenceType {
  if (differenceAmount === 0) return "balanced";
  return differenceAmount < 0 ? "shortage" : "overage";
}
