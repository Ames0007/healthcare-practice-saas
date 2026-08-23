"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { TodayKpis } from "@/features/today/types";

export function KpiRow({ kpis }: { kpis: TodayKpis }) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label={t("aujourdhui.kpis.total")} value={kpis.total} />
      <MetricCard label={t("aujourdhui.kpis.confirmed")} value={kpis.confirmed} />
      <MetricCard
        label={t("aujourdhui.kpis.toConfirm")}
        value={kpis.toConfirm}
        emphasis={kpis.toConfirm > 0 ? "warning" : "neutral"}
      />
      <MetricCard
        label={t("aujourdhui.kpis.noShow")}
        value={kpis.noShow}
        emphasis={kpis.noShow > 0 ? "danger" : "neutral"}
      />
    </div>
  );
}
