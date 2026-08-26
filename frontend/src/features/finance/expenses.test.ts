import { describe, expect, it } from "vitest";
import type { CabinetExpense } from "@/components/domain/finance/types";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { buildCashMovements, computeIncomingTotal, computeOutgoingTotal, computeTheoreticalBalance } from "@/features/caisse/calculations";
import { MOCK_BUSINESS_DATE } from "@/features/caisse/mock-data";
import {
  ALLOWED_SUPPORTING_MIME_TYPES,
  computeExpensesTotal,
  createExpenseAndMovement,
  filterTodayPostedExpenses,
  isValidExpenseAmount,
  nextSyntheticTimeForSequence,
  sortExpensesNewestFirst,
} from "./expenses";

describe("ALLOWED_SUPPORTING_MIME_TYPES", () => {
  it("allows only the conservative clinical-document precedent (UI-006D §27)", () => {
    expect(ALLOWED_SUPPORTING_MIME_TYPES).toEqual(["application/pdf", "image/jpeg", "image/png"]);
  });
});

describe("isValidExpenseAmount", () => {
  it("accepts a positive whole-MAD integer", () => {
    expect(isValidExpenseAmount(350)).toBe(true);
    expect(isValidExpenseAmount(1)).toBe(true);
  });

  it("rejects zero (UI-006D §20)", () => {
    expect(isValidExpenseAmount(0)).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(isValidExpenseAmount(-50)).toBe(false);
  });

  it("rejects a non-integer amount", () => {
    expect(isValidExpenseAmount(50.5)).toBe(false);
  });

  it("rejects NaN (invalid numeric input)", () => {
    expect(isValidExpenseAmount(Number.NaN)).toBe(false);
  });
});

describe("filterTodayPostedExpenses", () => {
  const fixtures = getExpensesMockData();

  it("keeps only posted expenses dated exactly businessDate", () => {
    const result = filterTodayPostedExpenses(fixtures, MOCK_BUSINESS_DATE);
    expect(result.map((expense) => expense.id)).toEqual(["exp-1"]);
  });

  it("excludes a cancelled expense even when its date matches", () => {
    const result = filterTodayPostedExpenses(fixtures, "2026-08-18");
    expect(result).toHaveLength(0);
  });

  it("excludes expenses from other days", () => {
    const result = filterTodayPostedExpenses(fixtures, "2026-08-20");
    expect(result.map((expense) => expense.id)).toEqual(["exp-2"]);
  });
});

describe("sortExpensesNewestFirst", () => {
  it("orders by time descending", () => {
    const expenses: CabinetExpense[] = [
      { id: "a", date: MOCK_BUSINESS_DATE, time: "09:00", label: "A", category: "other", amount: 10, status: "posted" },
      { id: "b", date: MOCK_BUSINESS_DATE, time: "11:00", label: "B", category: "other", amount: 10, status: "posted" },
      { id: "c", date: MOCK_BUSINESS_DATE, time: "10:00", label: "C", category: "other", amount: 10, status: "posted" },
    ];

    expect(sortExpensesNewestFirst(expenses).map((expense) => expense.id)).toEqual(["b", "c", "a"]);
  });

  it("sorts a missing time (legacy date-only fixture) after every timed expense", () => {
    const expenses: CabinetExpense[] = [
      { id: "legacy", date: MOCK_BUSINESS_DATE, label: "Legacy", category: "other", amount: 10, status: "posted" },
      { id: "timed", date: MOCK_BUSINESS_DATE, time: "00:01", label: "Timed", category: "other", amount: 10, status: "posted" },
    ];

    expect(sortExpensesNewestFirst(expenses).map((expense) => expense.id)).toEqual(["timed", "legacy"]);
  });

  it("does not rely on input/insertion order (UI-006D §16)", () => {
    const expenses: CabinetExpense[] = [
      { id: "z", date: MOCK_BUSINESS_DATE, time: "08:00", label: "Z", category: "other", amount: 10, status: "posted" },
      { id: "a", date: MOCK_BUSINESS_DATE, time: "09:00", label: "A", category: "other", amount: 10, status: "posted" },
    ];

    expect(sortExpensesNewestFirst(expenses).map((expense) => expense.id)).toEqual(["a", "z"]);
  });
});

describe("computeExpensesTotal", () => {
  it("sums the given expenses' amounts", () => {
    const expenses: CabinetExpense[] = [
      { id: "a", date: MOCK_BUSINESS_DATE, label: "A", category: "other", amount: 150, status: "posted" },
      { id: "b", date: MOCK_BUSINESS_DATE, label: "B", category: "other", amount: 320, status: "posted" },
    ];

    expect(computeExpensesTotal(expenses)).toBe(470);
  });

  it("returns 0 for an empty list", () => {
    expect(computeExpensesTotal([])).toBe(0);
  });
});

describe("nextSyntheticTimeForSequence", () => {
  it("is deterministic and never Date.now()-derived", () => {
    expect(nextSyntheticTimeForSequence(1)).toBe("10:07");
    expect(nextSyntheticTimeForSequence(2)).toBe("10:14");
    expect(nextSyntheticTimeForSequence(1)).toBe(nextSyntheticTimeForSequence(1));
  });
});

describe("createExpenseAndMovement", () => {
  const context = { sequence: 1, businessDate: MOCK_BUSINESS_DATE, cashSessionId: "cs-2026-08-23", createdBy: "Meryem Bakkali" };

  it("builds a posted expense with the given input", () => {
    const { expense } = createExpenseAndMovement(
      { category: "supplies", amount: 350, description: "Papeterie cabinet" },
      context,
    );

    expect(expense).toMatchObject({
      id: "exp-new-1",
      date: MOCK_BUSINESS_DATE,
      time: "10:07",
      label: "Papeterie cabinet",
      category: "supplies",
      amount: 350,
      status: "posted",
      createdBy: "Meryem Bakkali",
    });
  });

  it("builds a matching CashMovement OUT (UI-006D §29/§39 reference/amount integrity)", () => {
    const { expense, movement } = createExpenseAndMovement(
      { category: "supplies", amount: 350, description: "Papeterie cabinet" },
      context,
    );

    expect(movement.direction).toBe("out");
    expect(movement.type).toBe("expense");
    expect(movement.expenseId).toBe(expense.id);
    expect(movement.amount).toBe(expense.amount);
    expect(movement.cashSessionId).toBe(context.cashSessionId);
    expect(movement.occurredAt).toBe(expense.time);
    expect(movement.label).toBe(expense.label);
  });

  it("carries optional supporting-document metadata through untouched", () => {
    const supportingDocument = { fileName: "recu-papeterie.pdf", mimeType: "application/pdf", sizeBytes: 204800 };
    const { expense } = createExpenseAndMovement(
      { category: "supplies", amount: 350, description: "Papeterie cabinet", supportingDocument },
      context,
    );

    expect(expense.supportingDocument).toEqual(supportingDocument);
  });

  it("omits supporting-document metadata when none was provided", () => {
    const { expense } = createExpenseAndMovement({ category: "other", amount: 10, description: "X" }, context);
    expect(expense.supportingDocument).toBeUndefined();
  });

  it("never stores raw file contents (no File/Blob/base64/ObjectURL fields)", () => {
    const supportingDocument = { fileName: "x.pdf", mimeType: "application/pdf", sizeBytes: 100 };
    const { expense } = createExpenseAndMovement(
      { category: "other", amount: 10, description: "X", supportingDocument },
      context,
    );

    expect(Object.keys(expense.supportingDocument!)).toEqual(["fileName", "mimeType", "sizeBytes"]);
  });
});

describe("UI-006A/C Caisse balance integrity (UI-006D §31)", () => {
  it("decreases the theoretical Caisse balance by exactly the new expense amount", () => {
    const payments = getPaymentsMockData();
    const patients = getPatientsMockData();
    const existingExpenses = getExpensesMockData();
    const sessionId = "cs-2026-08-23";
    const openingBalance = 500;

    const before = buildCashMovements(payments, existingExpenses, patients, sessionId, MOCK_BUSINESS_DATE);
    const incoming = computeIncomingTotal(before);
    const outgoingBefore = computeOutgoingTotal(before);
    const theoreticalBefore = computeTheoreticalBalance(openingBalance, incoming, outgoingBefore);

    const { expense, movement } = createExpenseAndMovement(
      { category: "supplies", amount: 350, description: "Papeterie cabinet" },
      { sequence: 1, businessDate: MOCK_BUSINESS_DATE, cashSessionId: sessionId, createdBy: "Meryem Bakkali" },
    );

    const after = [...before, movement];
    const outgoingAfter = computeOutgoingTotal(after);
    const theoreticalAfter = computeTheoreticalBalance(openingBalance, incoming, outgoingAfter);

    expect(outgoingAfter).toBe(outgoingBefore + expense.amount);
    expect(theoreticalAfter).toBe(theoreticalBefore - expense.amount);
  });
});
