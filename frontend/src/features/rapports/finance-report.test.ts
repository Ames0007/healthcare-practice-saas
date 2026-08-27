import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { computeFinanceReportSummary, computeInvoiced } from "./finance-report";

describe("computeInvoiced (real fixtures, August 2026)", () => {
  it("sums only inv-1 (issued 2026-08-01, 3000 MAD) — inv-1b/inv-2/inv-3 were issued in July, inv-1c is cancelled", () => {
    const range = getPeriodRange("month", MOCK_BUSINESS_DATE);
    expect(computeInvoiced(getInvoicesMockData(), range)).toBe(3000);
  });

  it("returns 0 for a period with no issued invoices", () => {
    const range = getPeriodRange("today", "2026-01-01");
    expect(computeInvoiced(getInvoicesMockData(), range)).toBe(0);
  });
});

describe("computeFinanceReportSummary (real fixtures, August 2026)", () => {
  const range = getPeriodRange("month", MOCK_BUSINESS_DATE);
  const summary = computeFinanceReportSummary(getInvoicesMockData(), getPaymentsMockData(), getExpensesMockData(), range);

  it("invoiced 3000 MAD (inv-1 only)", () => {
    expect(summary.invoiced).toBe(3000);
  });

  it("collected 1500 MAD (pay-3 + pay-5 + pay-6, the three August installments of inv-1; pay-4 is reversed)", () => {
    expect(summary.collected).toBe(1500);
  });

  it("receivable/overdue are not period-scoped — reconcile exactly with getFinancialSummary's own cabinet-wide totals (3700 / 2200)", () => {
    expect(summary.receivable).toBe(3700);
    expect(summary.overdue).toBe(2200);
  });

  it("collection rate is collected/invoiced = 1500/3000 = 50%", () => {
    expect(summary.collectionRatePercent).toBe(50);
  });

  it("collection rate is 0, not NaN/Infinity, when nothing was invoiced in the period", () => {
    const emptyRange = getPeriodRange("today", "2026-01-01");
    const emptySummary = computeFinanceReportSummary(getInvoicesMockData(), getPaymentsMockData(), getExpensesMockData(), emptyRange);
    expect(emptySummary.collectionRatePercent).toBe(0);
    expect(Number.isFinite(emptySummary.collectionRatePercent)).toBe(true);
  });
});
