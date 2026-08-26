"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import { formatMad } from "@/features/finance/format";
import type { FinanceKpis } from "@/features/finance/types";

export interface KpiSummaryProps {
  kpis: FinanceKpis;
}

/**
 * Core financial health KPIs (UI-006A §17/§19-20, re-hierarchized by
 * UI-006X §17): four neutral MetricCards, emphasis carried by typography
 * color only, never a giant colored block (Spec #10 §22). "Position
 * caisse" was removed here — the dashboard's own `DashboardCaisseSection`
 * now shows Caisse's real `CashSession` state instead of approximating it
 * (UI-006X §18-19), so this row stays a period-scoped financial-health
 * summary, a separate concept from Caisse's own operational state (§22).
 */
export function KpiSummary({ kpis }: KpiSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard label={t("finance.kpis.collected")} value={formatMad(kpis.collected, locale)} />
      <MetricCard label={t("finance.kpis.receivable")} value={formatMad(kpis.receivable, locale)} />
      <MetricCard
        label={t("finance.kpis.overdue")}
        value={formatMad(kpis.overdue, locale)}
        emphasis={kpis.overdue > 0 ? "danger" : "neutral"}
      />
      <MetricCard label={t("finance.kpis.disbursed")} value={formatMad(kpis.disbursed, locale)} />
    </div>
  );
}
