"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { StockReportKpis } from "@/components/domain/reports/types";

export interface StockReportKpiSummaryProps {
  kpis: StockReportKpis;
}

export function StockReportKpiSummary({ kpis }: StockReportKpiSummaryProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <MetricCard
        label={t("rapports.stock.kpis.outOfStock")}
        value={kpis.outOfStockCount}
        emphasis={kpis.outOfStockCount > 0 ? "danger" : "neutral"}
      />
      <MetricCard
        label={t("rapports.stock.kpis.lowStock")}
        value={kpis.lowStockCount}
        emphasis={kpis.lowStockCount > 0 ? "warning" : "neutral"}
      />
      <MetricCard
        label={t("rapports.stock.kpis.expiringLots")}
        value={kpis.expiringLotsCount}
        emphasis={kpis.expiringLotsCount > 0 ? "danger" : "neutral"}
      />
    </div>
  );
}
