import { describe, expect, it } from "vitest";
import type { CabinetExpense, Payment } from "@/components/domain/finance/types";
import { getEffectivePaidAmount } from "@/features/patients/payments";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { computeCashBalance } from "@/features/finance/aggregations";
import {
  buildCashMovements,
  computeIncomingTotal,
  computeOutgoingTotal,
  computeTheoreticalBalance,
  isValidOpeningBalance,
} from "./calculations";
import { MOCK_BUSINESS_DATE } from "./mock-data";

const patients = getPatientsMockData();

describe("buildCashMovements", () => {
  it("derives a single incoming movement from a real posted cash payment on the given date", () => {
    const movements = buildCashMovements(getPaymentsMockData(), [], patients, "cs-1", "2026-08-22");

    expect(movements).toEqual([
      {
        id: "mv-pay-6",
        cashSessionId: "cs-1",
        occurredAt: "08:30",
        direction: "in",
        type: "patient_payment",
        amount: 500,
        label: "Ahmed El Mansouri",
        reference: "REC-2026-00382",
        patientId: "pat-1",
        paymentId: "pay-6",
      },
    ]);
  });

  it("derives a single outgoing movement from a real posted expense on the given date (MOCK_BUSINESS_DATE)", () => {
    const movements = buildCashMovements([], getExpensesMockData(), patients, "cs-1", MOCK_BUSINESS_DATE);

    expect(movements).toEqual([
      {
        id: "mv-exp-1",
        cashSessionId: "cs-1",
        occurredAt: "08:30",
        direction: "out",
        type: "expense",
        amount: 150,
        label: "Fournitures médicales",
        expenseId: "exp-1",
      },
    ]);
  });

  it("never includes a reversed payment even when it falls on the session's business date", () => {
    const reversed: Payment = {
      id: "p1",
      patientId: "pat-9",
      paymentNumber: "PAY-2026-9999",
      paymentDate: "2026-08-05",
      amount: 2200,
      method: "cash",
      status: "reversed",
      allocations: [],
      reversalReason: "test",
    };

    expect(buildCashMovements([reversed], [], patients, "cs-1", "2026-08-05")).toEqual([]);
  });

  it("never includes a cancelled expense even when it falls on the session's business date (real exp-5 fixture)", () => {
    // exp-5 is dated 2026-08-18 and deliberately cancelled (UI-006A's own exclusion-proof fixture).
    const movements = buildCashMovements([], getExpensesMockData(), patients, "cs-1", "2026-08-18");
    expect(movements).toEqual([]);
  });

  it("never mixes movements from other days into the session's business date", () => {
    const movements = buildCashMovements(getPaymentsMockData(), getExpensesMockData(), patients, "cs-1", "2026-09-01");
    expect(movements).toEqual([]);
  });

  it("orders multiple same-day movements deterministically, newest synthetic time first", () => {
    const payment: Payment = {
      id: "p-sync",
      patientId: "pat-1",
      paymentNumber: "PAY-2026-0100",
      paymentDate: "2026-08-23",
      amount: 300,
      method: "cash",
      status: "posted",
      allocations: [],
      receipt: { id: "r-sync", receiptNumber: "REC-2026-00500", paymentId: "p-sync", issuedAt: "2026-08-23" },
    };
    const expense: CabinetExpense = {
      id: "e-sync",
      date: "2026-08-23",
      label: "Test expense",
      category: "other",
      amount: 100,
      status: "posted",
    };

    const movements = buildCashMovements([payment], [expense], patients, "cs-1", "2026-08-23");

    // "expense-e-sync" < "payment-p-sync" alphabetically, so the expense gets the
    // earlier synthetic time and the payment the later one — display order (newest
    // first) therefore puts the payment movement first.
    expect(movements.map((movement) => movement.id)).toEqual(["mv-p-sync", "mv-e-sync"]);
    expect(movements[0].occurredAt >= movements[1].occurredAt).toBe(true);
  });

  it("is deterministic across repeated calls with the same input", () => {
    const a = buildCashMovements(getPaymentsMockData(), getExpensesMockData(), patients, "cs-1", "2026-08-22");
    const b = buildCashMovements(getPaymentsMockData(), getExpensesMockData(), patients, "cs-1", "2026-08-22");
    expect(a).toEqual(b);
  });
});

describe("computeIncomingTotal / computeOutgoingTotal", () => {
  it("sums only 'in'/'out' movements respectively", () => {
    const movements = buildCashMovements(getPaymentsMockData(), getExpensesMockData(), patients, "cs-1", MOCK_BUSINESS_DATE);
    expect(computeIncomingTotal(movements)).toBe(0);
    expect(computeOutgoingTotal(movements)).toBe(150);
  });
});

describe("cash integrity: payment reconciliation (UI-006C §38)", () => {
  it("sum(derived incoming movements) equals sum(effective posted cash payments) for the session date", () => {
    const businessDate = "2026-08-22";
    const payments = getPaymentsMockData();
    const movements = buildCashMovements(payments, [], patients, "cs-1", businessDate);

    const expected = getEffectivePaidAmount(payments.filter((payment) => payment.paymentDate === businessDate));

    expect(computeIncomingTotal(movements)).toBe(expected);
    expect(expected).toBe(500);
  });
});

describe("cash integrity: expense reconciliation (UI-006C §39)", () => {
  it("sum(derived outgoing movements) equals sum(posted cash expenses) for the session date", () => {
    const businessDate = MOCK_BUSINESS_DATE;
    const expenses = getExpensesMockData();
    const movements = buildCashMovements([], expenses, patients, "cs-1", businessDate);

    const expected = expenses
      .filter((expense) => expense.status === "posted" && expense.date === businessDate)
      .reduce((sum, expense) => sum + expense.amount, 0);

    expect(computeOutgoingTotal(movements)).toBe(expected);
    expect(expected).toBe(150);
  });
});

describe("movement reference integrity (UI-006C §41-42)", () => {
  it("every patient_payment movement's paymentId/patientId resolve to a real matching Payment", () => {
    const payments = getPaymentsMockData();
    const movements = buildCashMovements(payments, [], patients, "cs-1", "2026-08-22");

    for (const movement of movements) {
      const source = payments.find((payment) => payment.id === movement.paymentId)!;
      expect(source).toBeDefined();
      expect(source.patientId).toBe(movement.patientId);
      expect(source.amount).toBe(movement.amount);
      expect(source.receipt?.receiptNumber).toBe(movement.reference);
    }
  });

  it("every expense movement's expenseId resolves to a real matching CabinetExpense", () => {
    const expenses = getExpensesMockData();
    const movements = buildCashMovements([], expenses, patients, "cs-1", MOCK_BUSINESS_DATE);

    for (const movement of movements) {
      const source = expenses.find((expense) => expense.id === movement.expenseId)!;
      expect(source).toBeDefined();
      expect(source.amount).toBe(movement.amount);
      expect(source.label).toBe(movement.label);
    }
  });
});

describe("computeTheoreticalBalance", () => {
  it("opening + incoming - outgoing (UI-006C §24/§40)", () => {
    expect(computeTheoreticalBalance(500, 0, 150)).toBe(350);
    expect(computeTheoreticalBalance(500, 500, 0)).toBe(1000);
    expect(computeTheoreticalBalance(0, 0, 0)).toBe(0);
  });

  it("is the same shared primitive as `computeCashBalance` (UI-006C §43) — no duplicate formula", () => {
    // UI-006X removed the Finance dashboard's own "Position caisse" projection (the formula's
    // other former caller) in favor of showing this real Caisse state directly, so
    // `computeCashBalance` now has exactly one caller left — this one.
    expect(computeTheoreticalBalance(500, 1500, 900)).toBe(computeCashBalance(500, 1500, 900));
  });
});

describe("isValidOpeningBalance", () => {
  it("accepts zero and positive whole-MAD amounts", () => {
    expect(isValidOpeningBalance(0)).toBe(true);
    expect(isValidOpeningBalance(500)).toBe(true);
  });

  it("rejects negative amounts", () => {
    expect(isValidOpeningBalance(-1)).toBe(false);
    expect(isValidOpeningBalance(-500)).toBe(false);
  });

  it("rejects non-integer amounts (CLAUDE.md §20 whole-MAD discipline)", () => {
    expect(isValidOpeningBalance(500.5)).toBe(false);
  });
});
