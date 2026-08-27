"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { HrReportKpis } from "@/components/domain/reports/types";
import { formatHours } from "../format";

export interface HrReportKpiSummaryProps {
  kpis: HrReportKpis;
}

export function HrReportKpiSummary({ kpis }: HrReportKpiSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard label={t("rapports.equipe.kpis.activeHeadcount")} value={kpis.activeHeadcount} />
      <MetricCard label={t("rapports.equipe.kpis.workedHours")} value={formatHours(kpis.workedHours, locale)} />
      <MetricCard
        label={t("rapports.equipe.kpis.lateCount")}
        value={kpis.lateCount}
        emphasis={kpis.lateCount > 0 ? "warning" : "neutral"}
      />
      <MetricCard label={t("rapports.equipe.kpis.overtimeHours")} value={formatHours(kpis.overtimeHours, locale)} />
    </div>
  );
}
