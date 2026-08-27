"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { StockKpis } from "@/features/stock/dashboard";

export interface StockKpiSummaryProps {
  kpis: StockKpis;
}

/** The three Inventory KPIs Spec #2 §42.5 defines — no invented fourth metric. Emphasis carried by typography color only (Spec #10 §22), mirrors `KpiSummary`'s own pattern. */
export function StockKpiSummary({ kpis }: StockKpiSummaryProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard
        label={t("stock.dashboard.kpis.lowStockItems")}
        value={kpis.lowStockItemsCount}
        emphasis={kpis.lowStockItemsCount > 0 ? "warning" : "neutral"}
      />
      <MetricCard
        label={t("stock.dashboard.kpis.expiringLots")}
        value={kpis.expiringLotsCount}
        emphasis={kpis.expiringLotsCount > 0 ? "danger" : "neutral"}
      />
      <MetricCard label={t("stock.dashboard.kpis.movementVolume")} value={kpis.movementVolumeCount} />
    </div>
  );
}
