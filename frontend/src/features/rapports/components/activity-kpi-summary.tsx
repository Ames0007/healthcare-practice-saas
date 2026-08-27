"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { ActivityReportKpis } from "@/components/domain/reports/types";
import { formatPercent } from "../format";

export interface ActivityKpiSummaryProps {
  kpis: ActivityReportKpis;
}

export function ActivityKpiSummary({ kpis }: ActivityKpiSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard label={t("rapports.activity.kpis.appointments")} value={kpis.appointmentsCount} />
      <MetricCard label={t("rapports.activity.kpis.patientsSeen")} value={kpis.patientsSeenCount} />
      <MetricCard
        label={t("rapports.activity.kpis.noShowRate")}
        value={formatPercent(kpis.noShowRatePercent, locale)}
        emphasis={kpis.noShowRatePercent > 0 ? "warning" : "neutral"}
      />
    </div>
  );
}
