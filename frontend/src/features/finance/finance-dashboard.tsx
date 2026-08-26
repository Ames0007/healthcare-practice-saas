"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { CabinetExpense, CashSession, Invoice, Payment } from "@/components/domain/finance/types";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import type { Patient } from "@/features/patients/types";
import { getDefaultOpenSessionMockData, MOCK_BUSINESS_DATE } from "@/features/caisse/mock-data";
import { getExpensesMockData } from "./mock-expenses-data";
import { buildReceivables, buildRecentActivity, computeFinanceKpis, getPeriodRange } from "./aggregations";
import type { FinancePeriod } from "./types";
import { FinanceNav } from "./components/finance-nav";
import { PeriodSelector } from "./components/period-selector";
import { KpiSummary } from "./components/kpi-summary";
import { DashboardCaisseSection } from "./components/dashboard-caisse-section";
import { ReceivablesSection } from "./components/receivables-section";
import { RecentActivitySection } from "./components/recent-activity-section";
import { FinanceDashboardSkeleton } from "./components/finance-dashboard-skeleton";

/** Spec #9 Screen 24's own illustrated default ("Ce mois" shown ahead of the period dropdown). */
const DEFAULT_PERIOD: FinancePeriod = "month";

export type FinanceDashboardState = "loading" | "loaded" | "error";

export interface FinanceDashboardProps {
  /** Prototype seams (mirrors Aujourd'hui/Patients, UI-001/UI-003A): swap for real query results later. */
  invoices?: Invoice[];
  payments?: Payment[];
  expenses?: CabinetExpense[];
  patients?: Patient[];
  /** Mirrors `CaissePage`'s own seam (UI-006C): omit for the live default (already open), pass `null` to exercise the closed state. */
  caisseSession?: CashSession | null;
  state?: FinanceDashboardState;
  onRetry?: () => void;
}

/**
 * Cabinet Finance dashboard (UI-006A, recomposed by UI-006X) — the
 * cabinet-wide financial command center, distinct from Patient 360°'s own
 * Factures/Paiements tabs (CLAUDE.md §12/§19). Every KPI/receivable/
 * activity/Caisse figure is derived from the existing UI-004D/E/UI-006A/C
 * fixtures and calculations — never an independently hardcoded total. The
 * former "Position caisse" KPI (a period-constant projection) is gone,
 * replaced by `DashboardCaisseSection` showing Caisse's own real
 * `CashSession` state (UI-006X §18-19). Mock data only; no backend
 * integration, no Caisse open/close, no expense entry, no cabinet-level
 * payment capture.
 */
export function FinanceDashboard({
  invoices: providedInvoices,
  payments: providedPayments,
  expenses: providedExpenses,
  patients: providedPatients,
  caisseSession,
  state = "loaded",
  onRetry,
}: FinanceDashboardProps) {
  const { t } = useLocale();
  const [period, setPeriod] = useState<FinancePeriod>(DEFAULT_PERIOD);
  const [session] = useState<CashSession | null>(() =>
    caisseSession !== undefined ? caisseSession : getDefaultOpenSessionMockData(),
  );

  if (state === "loading") {
    return <FinanceDashboardSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("finance.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("finance.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const invoices = providedInvoices ?? getInvoicesMockData();
  const payments = providedPayments ?? getPaymentsMockData();
  const expenses = providedExpenses ?? getExpensesMockData();
  const patients = providedPatients ?? getPatientsMockData();

  const range = getPeriodRange(period, MOCK_BUSINESS_DATE);
  const kpis = computeFinanceKpis(invoices, payments, expenses, range);
  const receivables = buildReceivables(invoices, patients);
  const activity = buildRecentActivity(payments, expenses, invoices, patients, range);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("finance.pageTitle")} description={t("finance.pageDescription")} />

      <FinanceNav />

      <div className="flex flex-col gap-8">
        <PeriodSelector period={period} onChange={setPeriod} />

        <KpiSummary kpis={kpis} />

        <DashboardCaisseSection
          session={session}
          payments={payments}
          expenses={expenses}
          patients={patients}
          businessDate={MOCK_BUSINESS_DATE}
        />

        <ReceivablesSection receivables={receivables} />

        <RecentActivitySection activity={activity} />
      </div>
    </div>
  );
}
