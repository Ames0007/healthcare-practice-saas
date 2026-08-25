import { describe, expect, it } from "vitest";
import type { CabinetExpense, Invoice, Payment } from "@/components/domain/finance/types";
import { getFinancialSummary } from "@/features/patients/finance";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getExpensesMockData } from "./mock-expenses-data";
import {
  buildReceivables,
  buildRecentActivity,
  computeCashPosition,
  computeCollected,
  computeDisbursed,
  computeFinanceKpis,
  computeReceivableAndOverdue,
  getPeriodRange,
  OPENING_CASH_POSITION,
} from "./aggregations";

const BUSINESS_DATE = "2026-08-23"; // Sunday — mirrors `MOCK_BUSINESS_DATE` (features/today/mock-data.ts)

describe("getPeriodRange", () => {
  it("resolves 'today' to a single-day range on the business date", () => {
    expect(getPeriodRange("today", BUSINESS_DATE)).toEqual({ start: "2026-08-23", end: "2026-08-23" });
  });

  it("resolves 'week' to the Monday-start week containing the business date (Agenda's own convention)", () => {
    expect(getPeriodRange("week", BUSINESS_DATE)).toEqual({ start: "2026-08-17", end: "2026-08-23" });
  });

  it("resolves 'month' to the full calendar month containing the business date", () => {
    expect(getPeriodRange("month", BUSINESS_DATE)).toEqual({ start: "2026-08-01", end: "2026-08-31" });
  });
});

describe("computeCollected", () => {
  it("sums only posted payments within the period, excluding reversed payments (UI-004E's pay-4)", () => {
    const payments = getPaymentsMockData();

    const month = computeCollected(payments, getPeriodRange("month", BUSINESS_DATE));
    const week = computeCollected(payments, getPeriodRange("week", BUSINESS_DATE));
    const today = computeCollected(payments, getPeriodRange("today", BUSINESS_DATE));

    expect(month).toBe(1500); // pay-3 (500) + pay-5 (500) + pay-6 (500); pay-4 reversed excluded; pay-1/pay-2 are July
    expect(week).toBe(500); // pay-6 only (2026-08-22)
    expect(today).toBe(0); // no payment fixture is dated exactly on the business date
  });

  it("never counts a reversed payment even when it falls inside the period", () => {
    const reversed: Payment = {
      id: "p1",
      patientId: "pat-x",
      paymentNumber: "PAY-2026-9999",
      paymentDate: BUSINESS_DATE,
      amount: 999,
      method: "cash",
      status: "reversed",
      allocations: [],
      reversalReason: "test",
    };

    expect(computeCollected([reversed], getPeriodRange("today", BUSINESS_DATE))).toBe(0);
  });
});

describe("computeReceivableAndOverdue", () => {
  it("matches getFinancialSummary's remainingAmount/overdueAmount exactly (single source of truth)", () => {
    const invoices = getInvoicesMockData();
    const summary = getFinancialSummary(invoices);

    expect(computeReceivableAndOverdue(invoices)).toEqual({
      receivable: summary.remainingAmount,
      overdue: summary.overdueAmount,
    });
    expect(computeReceivableAndOverdue(invoices)).toEqual({ receivable: 3700, overdue: 2200 });
  });

  it("is not period-scoped — a current balance, not a period activity flow", () => {
    const invoices = getInvoicesMockData();
    const a = computeReceivableAndOverdue(invoices);
    const b = computeReceivableAndOverdue(invoices);
    expect(a).toEqual(b);
  });

  it("excludes cancelled invoices from the receivable total", () => {
    const cancelled: Invoice = {
      id: "inv-x",
      patientId: "pat-x",
      invoiceNumber: "FAC-2026-99999",
      issuedDate: BUSINESS_DATE,
      status: "cancelled",
      currency: "MAD",
      description: "test",
      practitionerName: "Dr. Test",
      totalAmount: 5000,
      paidAmount: 0,
      remainingAmount: 0,
      lines: [],
      installments: [],
    };

    expect(computeReceivableAndOverdue([cancelled])).toEqual({ receivable: 0, overdue: 0 });
  });
});

describe("computeDisbursed", () => {
  it("sums only posted expenses within the period, excluding the cancelled fixture (exp-5)", () => {
    const expenses = getExpensesMockData();

    expect(computeDisbursed(expenses, getPeriodRange("month", BUSINESS_DATE))).toBe(900); // exp-1+exp-2+exp-3
    expect(computeDisbursed(expenses, getPeriodRange("week", BUSINESS_DATE))).toBe(450); // exp-1+exp-2
    expect(computeDisbursed(expenses, getPeriodRange("today", BUSINESS_DATE))).toBe(150); // exp-1 only
  });

  it("never counts a cancelled expense even when it falls inside the period", () => {
    const cancelled: CabinetExpense = {
      id: "exp-x",
      date: BUSINESS_DATE,
      label: "test",
      category: "other",
      amount: 999,
      status: "cancelled",
    };

    expect(computeDisbursed([cancelled], getPeriodRange("today", BUSINESS_DATE))).toBe(0);
  });
});

describe("computeCashPosition", () => {
  it("applies opening position + collected − disbursed", () => {
    expect(computeCashPosition(1500, 900)).toBe(OPENING_CASH_POSITION + 1500 - 900);
    expect(OPENING_CASH_POSITION).toBe(500); // matches Spec #9 Screen 30's own illustrative "Solde initial"
  });
});

describe("computeFinanceKpis", () => {
  it("assembles all five KPIs consistently for the month period", () => {
    const invoices = getInvoicesMockData();
    const payments = getPaymentsMockData();
    const expenses = getExpensesMockData();
    const range = getPeriodRange("month", BUSINESS_DATE);

    expect(computeFinanceKpis(invoices, payments, expenses, range)).toEqual({
      collected: 1500,
      receivable: 3700,
      overdue: 2200,
      disbursed: 900,
      cashPosition: 1100,
    });
  });
});

describe("buildReceivables", () => {
  it("orders overdue first, then currently due, excludes cancelled/paid invoices", () => {
    const invoices = getInvoicesMockData();
    const patients = getPatientsMockData();

    const receivables = buildReceivables(invoices, patients);

    expect(receivables.map((item) => item.invoiceId)).toEqual(["inv-3", "inv-1"]);
    expect(receivables[0].status).toBe("overdue");
    expect(receivables[1].status).toBe("partially_paid");
    expect(receivables.some((item) => item.invoiceId === "inv-1c")).toBe(false); // cancelled
    expect(receivables.some((item) => item.invoiceId === "inv-1b")).toBe(false); // fully paid, 0 remaining
    expect(receivables.some((item) => item.invoiceId === "inv-2")).toBe(false); // fully paid, 0 remaining
  });

  it("resolves patient names via the shared patient fixtures", () => {
    const invoices = getInvoicesMockData();
    const patients = getPatientsMockData();
    const receivables = buildReceivables(invoices, patients);

    const overdue = receivables.find((item) => item.invoiceId === "inv-3")!;
    expect(overdue.patientName.length).toBeGreaterThan(0);
    expect(overdue.patientName).not.toBe("pat-9");
  });
});

describe("buildRecentActivity", () => {
  it("merges posted payments and posted expenses for the period, newest first", () => {
    const invoices = getInvoicesMockData();
    const payments = getPaymentsMockData();
    const expenses = getExpensesMockData();
    const patients = getPatientsMockData();
    const range = getPeriodRange("month", BUSINESS_DATE);

    const activity = buildRecentActivity(payments, expenses, invoices, patients, range);

    expect(activity).toHaveLength(6); // 3 posted payments + 3 posted expenses in August
    expect(activity[0].date).toBe("2026-08-23"); // exp-1, newest
    const dates = activity.map((item) => item.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("never includes a reversed payment or a cancelled expense", () => {
    const invoices = getInvoicesMockData();
    const payments = getPaymentsMockData();
    const expenses = getExpensesMockData();
    const patients = getPatientsMockData();
    const range = getPeriodRange("month", BUSINESS_DATE);

    const activity = buildRecentActivity(payments, expenses, invoices, patients, range);

    expect(activity.some((item) => item.id === "pay-4")).toBe(false);
    expect(activity.some((item) => item.id === "exp-5")).toBe(false);
  });

  it("resolves a payment's invoice number and an expense's category", () => {
    const invoices = getInvoicesMockData();
    const payments = getPaymentsMockData();
    const expenses = getExpensesMockData();
    const patients = getPatientsMockData();
    const range = getPeriodRange("month", BUSINESS_DATE);

    const activity = buildRecentActivity(payments, expenses, invoices, patients, range);

    const paymentEntry = activity.find((item) => item.type === "payment")!;
    expect(paymentEntry.invoiceNumber).toBeDefined();
    expect(paymentEntry.direction).toBe("in");

    const expenseEntry = activity.find((item) => item.type === "expense")!;
    expect(expenseEntry.category).toBeDefined();
    expect(expenseEntry.direction).toBe("out");
  });
});
