"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { FinanceReportSummary } from "@/components/domain/reports/types";
import { formatMad, formatPercent } from "../format";

export interface FinanceReportKpiSummaryProps {
  summary: FinanceReportSummary;
}

export function FinanceReportKpiSummary({ summary }: FinanceReportKpiSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard label={t("rapports.finance.kpis.invoiced")} value={formatMad(summary.invoiced, locale)} />
      <MetricCard label={t("rapports.finance.kpis.collected")} value={formatMad(summary.collected, locale)} />
      <MetricCard label={t("rapports.finance.kpis.receivable")} value={formatMad(summary.receivable, locale)} />
      <MetricCard
        label={t("rapports.finance.kpis.overdue")}
        value={formatMad(summary.overdue, locale)}
        emphasis={summary.overdue > 0 ? "danger" : "neutral"}
      />
      <MetricCard label={t("rapports.finance.kpis.collectionRate")} value={formatPercent(summary.collectionRatePercent, locale)} />
    </div>
  );
}
