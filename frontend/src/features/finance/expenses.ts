import type {
  CabinetExpense,
  CashMovement,
  ExpenseCategory,
  ExpenseSupportingDocument,
  MoneyAmount,
} from "@/components/domain/finance/types";

/**
 * Conservative existing clinical-document precedent (UI-006D §27), not a
 * final storage/security policy — mirrors `DocumentUploadDialog`'s own list.
 */
export const ALLOWED_SUPPORTING_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/** Display/select order for the centralized `EXPENSE_CATEGORY_MAP` registry (UI-006A §11), reused as-is — no new taxonomy. */
export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = ["supplies", "utilities", "services", "other"];

/** Whole-MAD, strictly positive (UI-006D §20) — a stricter rule than Caisse's own `isValidOpeningBalance` (which allows 0), so intentionally not the same function. */
export function isValidExpenseAmount(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/** Today's active décaissements (UI-006D §15): posted only, dated exactly `businessDate` — cancelled expenses and other days never appear. */
export function filterTodayPostedExpenses(expenses: CabinetExpense[], businessDate: string): CabinetExpense[] {
  return expenses.filter((expense) => expense.status === "posted" && expense.date === businessDate);
}

/**
 * Newest first (§16): by time descending, id as a stable tiebreak. A
 * missing `time` (UI-006A's original date-only fixtures) sorts as if it
 * were "00:00" — i.e. after every expense actually recorded through this
 * screen's own form, never a fabricated time.
 */
export function sortExpensesNewestFirst(expenses: CabinetExpense[]): CabinetExpense[] {
  return [...expenses].sort((a, b) => {
    const byTime = (b.time ?? "00:00").localeCompare(a.time ?? "00:00");
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}

export function computeExpensesTotal(expenses: CabinetExpense[]): MoneyAmount {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

/**
 * Deterministic prototype time-of-day for a newly recorded décaissement
 * (§24) — never `Date.now()`. Independent from Caisse's own
 * `syntheticTimeForIndex` (that one assigns times to *derived* movements
 * from existing fixtures; this one assigns a time to a *newly created*
 * expense at the moment of creation) but follows the same base+step
 * convention, keyed by a monotonically increasing creation sequence so
 * each new décaissement in a session gets a later time than the last.
 */
const NEW_EXPENSE_TIME_BASE_MINUTES = 10 * 60; // 10:00
const NEW_EXPENSE_TIME_STEP_MINUTES = 7;

export function nextSyntheticTimeForSequence(sequence: number): string {
  const totalMinutes = NEW_EXPENSE_TIME_BASE_MINUTES + sequence * NEW_EXPENSE_TIME_STEP_MINUTES;
  const hours = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export interface NewExpenseInput {
  category: ExpenseCategory;
  amount: MoneyAmount;
  description: string;
  supportingDocument?: ExpenseSupportingDocument;
}

export interface NewExpenseContext {
  sequence: number;
  businessDate: string;
  cashSessionId: string;
  createdBy: string;
}

/**
 * Atomic prototype creation (UI-006D §29-31): builds a matching
 * `CabinetExpense` + `CashMovement` pair in one pure call — direction
 * "out", type "expense", `movement.expenseId === expense.id`,
 * `movement.amount === expense.amount` always hold by construction, so
 * reference/amount integrity is structural, not just tested after the
 * fact. The caller (the page's create handler) applies both results to
 * local state together, making the operation conceptually atomic (no
 * intermediate render where one exists without the other).
 */
export function createExpenseAndMovement(
  input: NewExpenseInput,
  context: NewExpenseContext,
): { expense: CabinetExpense; movement: CashMovement } {
  const id = `exp-new-${context.sequence}`;
  const time = nextSyntheticTimeForSequence(context.sequence);

  const expense: CabinetExpense = {
    id,
    date: context.businessDate,
    time,
    label: input.description,
    category: input.category,
    amount: input.amount,
    status: "posted",
    createdBy: context.createdBy,
    supportingDocument: input.supportingDocument,
  };

  const movement: CashMovement = {
    id: `mv-${id}`,
    cashSessionId: context.cashSessionId,
    occurredAt: time,
    direction: "out",
    type: "expense",
    amount: expense.amount,
    label: expense.label,
    expenseId: expense.id,
  };

  return { expense, movement };
}
