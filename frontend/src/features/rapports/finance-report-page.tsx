"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { CabinetExpense, Invoice, Payment } from "@/components/domain/finance/types";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import type { FinancePeriod } from "@/features/finance/types";
import { PeriodSelector } from "@/features/finance/components/period-selector";
import { ReportsNav } from "./components/reports-nav";
import { ReportsSkeleton } from "./components/reports-skeleton";
import { FinanceReportKpiSummary } from "./components/finance-report-kpi-summary";
import { computeFinanceReportSummary } from "./finance-report";

const DEFAULT_PERIOD: FinancePeriod = "month";

export type FinanceReportPageState = "loading" | "loaded" | "error";

export interface FinanceReportPageProps {
  invoices?: Invoice[];
  payments?: Payment[];
  expenses?: CabinetExpense[];
  state?: FinanceReportPageState;
  onRetry?: () => void;
}

/**
 * Reports — Finance (UI-010ABC Gate 1), `/app/rapports/finance`. Reuses
 * `computeFinanceKpis` (UI-006A) unmodified for collected/receivable/
 * overdue via `computeFinanceReportSummary` — never a second Finance
 * dashboard with its own contradictory numbers.
 */
export function FinanceReportPage({
  invoices: providedInvoices,
  payments: providedPayments,
  expenses: providedExpenses,
  state = "loaded",
  onRetry,
}: FinanceReportPageProps) {
  const { t } = useLocale();
  const [period, setPeriod] = useState<FinancePeriod>(DEFAULT_PERIOD);

  if (state === "loading") {
    return <ReportsSkeleton metricCount={5} />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("rapports.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("rapports.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const invoices = providedInvoices ?? getInvoicesMockData();
  const payments = providedPayments ?? getPaymentsMockData();
  const expenses = providedExpenses ?? getExpensesMockData();

  const range = getPeriodRange(period, MOCK_BUSINESS_DATE);
  const summary = computeFinanceReportSummary(invoices, payments, expenses, range);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("rapports.finance.pageTitle")} description={t("rapports.finance.pageDescription")} />

      <ReportsNav />

      <div className="flex flex-col gap-8">
        <PeriodSelector period={period} onChange={setPeriod} />

        <FinanceReportKpiSummary summary={summary} />
      </div>
    </div>
  );
}
