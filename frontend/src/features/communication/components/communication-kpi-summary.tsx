"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { CommunicationKpis } from "@/features/communication/dashboard";

export interface CommunicationKpiSummaryProps {
  kpis: CommunicationKpis;
}

/** The three Communication KPIs (UI-009ABC §13) — emphasis carried by typography color only (Spec #10 §22), mirrors `StockKpiSummary`. */
export function CommunicationKpiSummary({ kpis }: CommunicationKpiSummaryProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard label={t("communication.dashboard.kpis.failed")} value={kpis.failedCount} emphasis={kpis.failedCount > 0 ? "danger" : "neutral"} />
      <MetricCard label={t("communication.dashboard.kpis.queued")} value={kpis.queuedCount} emphasis={kpis.queuedCount > 0 ? "warning" : "neutral"} />
      <MetricCard label={t("communication.dashboard.kpis.recentVolume")} value={kpis.recentVolumeCount} />
    </div>
  );
}
