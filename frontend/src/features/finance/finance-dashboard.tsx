"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import type { CabinetExpense, Invoice, Payment } from "@/components/domain/finance/types";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import type { Patient } from "@/features/patients/types";
import { getExpensesMockData } from "./mock-expenses-data";
import { buildReceivables, buildRecentActivity, computeFinanceKpis, getPeriodRange } from "./aggregations";
import type { FinancePeriod } from "./types";
import { PeriodSelector } from "./components/period-selector";
import { KpiSummary } from "./components/kpi-summary";
import { ReceivablesSection } from "./components/receivables-section";
import { RecentActivitySection } from "./components/recent-activity-section";
import { FinanceDashboardSkeleton } from "./components/finance-dashboard-skeleton";

/** Fixed prototype "today", matching Aujourd'hui/Agenda's own `MOCK_BUSINESS_DATE` (UI-001/UI-002) — not the real client clock. */
const BUSINESS_DATE = "2026-08-23";

/** Spec #9 Screen 24's own illustrated default ("Ce mois" shown ahead of the period dropdown). */
const DEFAULT_PERIOD: FinancePeriod = "month";

export type FinanceDashboardState = "loading" | "loaded" | "error";

export interface FinanceDashboardProps {
  /** Prototype seams (mirrors Aujourd'hui/Patients, UI-001/UI-003A): swap for real query results later. */
  invoices?: Invoice[];
  payments?: Payment[];
  expenses?: CabinetExpense[];
  patients?: Patient[];
  state?: FinanceDashboardState;
  onRetry?: () => void;
}

/**
 * Cabinet Finance dashboard (UI-006A) — the cabinet-wide financial command
 * center, distinct from Patient 360°'s own Factures/Paiements tabs
 * (CLAUDE.md §12/§19). Every KPI/receivable/activity figure is derived from
 * the existing UI-004D/E invoice/payment fixtures plus a small read-only
 * synthetic expense fixture set (§10/§11) — never an independently
 * hardcoded total. Mock data only; no backend integration, no Caisse
 * open/close, no expense entry, no cabinet-level payment capture (§52-56).
 */
export function FinanceDashboard({
  invoices: providedInvoices,
  payments: providedPayments,
  expenses: providedExpenses,
  patients: providedPatients,
  state = "loaded",
  onRetry,
}: FinanceDashboardProps) {
  const { t } = useLocale();
  const [period, setPeriod] = useState<FinancePeriod>(DEFAULT_PERIOD);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const range = getPeriodRange(period, BUSINESS_DATE);
  const kpis = computeFinanceKpis(invoices, payments, expenses, range);
  const receivables = buildReceivables(invoices, patients);
  const activity = buildRecentActivity(payments, expenses, invoices, patients, range);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("finance.pageTitle")} description={t("finance.pageDescription")} />

      <PeriodSelector period={period} onChange={setPeriod} />

      <KpiSummary kpis={kpis} />

      <ReceivablesSection
        receivables={receivables}
        onViewAllInvoices={() => setToastMessage(t("finance.receivables.viewAllNotice"))}
      />

      <RecentActivitySection activity={activity} />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
