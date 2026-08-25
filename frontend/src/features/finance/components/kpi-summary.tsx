"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import { formatMad } from "@/features/finance/format";
import type { FinanceKpis } from "@/features/finance/types";

export interface KpiSummaryProps {
  kpis: FinanceKpis;
}

/**
 * KPI row (UI-006A §17/§19-20): five neutral MetricCards, emphasis carried
 * by typography color only, never a giant colored block (Spec #10 §22).
 * `grid-cols-2 sm:grid-cols-3` intentionally wraps 5 cards into a 3+2
 * layout rather than forcing five cramped columns (§20).
 */
export function KpiSummary({ kpis }: KpiSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <MetricCard label={t("finance.kpis.collected")} value={formatMad(kpis.collected, locale)} />
      <MetricCard label={t("finance.kpis.receivable")} value={formatMad(kpis.receivable, locale)} />
      <MetricCard
        label={t("finance.kpis.overdue")}
        value={formatMad(kpis.overdue, locale)}
        emphasis={kpis.overdue > 0 ? "danger" : "neutral"}
      />
      <MetricCard label={t("finance.kpis.disbursed")} value={formatMad(kpis.disbursed, locale)} />
      <MetricCard
        label={t("finance.kpis.cashPosition")}
        value={formatMad(kpis.cashPosition, locale)}
        supportingText={t("finance.cashPositionNote")}
      />
    </div>
  );
}
