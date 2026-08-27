"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import type { ReportsOverview } from "@/components/domain/reports/types";
import { formatHours, formatMad, formatPercent } from "../format";

export interface OverviewSummaryProps {
  overview: ReportsOverview;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</div>
    </div>
  );
}

/**
 * The task's own Overview wireframe (§11): four category blocks (Activité/
 * Finance/Équipe/Stock), each exactly 3 metrics, emphasis carried by
 * typography color only (Spec #10 §22) — no giant colored blocks, no
 * charts (Spec #8 §36 prohibited patterns). Every value is read directly
 * off `ReportsOverview`, itself always computed by `computeReportsOverview`
 * from the same fixtures each detail report page reads — this component
 * never computes anything itself.
 */
export function OverviewSummary({ overview }: OverviewSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col gap-8">
      <Section title={t("rapports.overview.activitySection")}>
        <MetricCard label={t("rapports.overview.appointments")} value={overview.activity.appointmentsCount} />
        <MetricCard label={t("rapports.overview.patientsSeen")} value={overview.activity.patientsSeenCount} />
        <MetricCard
          label={t("rapports.overview.noShowRate")}
          value={formatPercent(overview.activity.noShowRatePercent, locale)}
          emphasis={overview.activity.noShowRatePercent > 0 ? "warning" : "neutral"}
        />
      </Section>

      <Section title={t("rapports.overview.financeSection")}>
        <MetricCard label={t("rapports.overview.collected")} value={formatMad(overview.finance.collected, locale)} />
        <MetricCard label={t("rapports.overview.receivable")} value={formatMad(overview.finance.receivable, locale)} />
        <MetricCard
          label={t("rapports.overview.overdue")}
          value={formatMad(overview.finance.overdue, locale)}
          emphasis={overview.finance.overdue > 0 ? "danger" : "neutral"}
        />
      </Section>

      <Section title={t("rapports.overview.hrSection")}>
        <MetricCard label={t("rapports.overview.workedHours")} value={formatHours(overview.hr.workedHours, locale)} />
        <MetricCard
          label={t("rapports.overview.lateCount")}
          value={overview.hr.lateCount}
          emphasis={overview.hr.lateCount > 0 ? "warning" : "neutral"}
        />
        <MetricCard label={t("rapports.overview.overtimeHours")} value={formatHours(overview.hr.overtimeHours, locale)} />
      </Section>

      <Section title={t("rapports.overview.stockSection")}>
        <MetricCard
          label={t("rapports.overview.outOfStock")}
          value={overview.stock.outOfStockCount}
          emphasis={overview.stock.outOfStockCount > 0 ? "danger" : "neutral"}
        />
        <MetricCard
          label={t("rapports.overview.lowStock")}
          value={overview.stock.lowStockCount}
          emphasis={overview.stock.lowStockCount > 0 ? "warning" : "neutral"}
        />
        <MetricCard
          label={t("rapports.overview.expiringLots")}
          value={overview.stock.expiringLotsCount}
          emphasis={overview.stock.expiringLotsCount > 0 ? "danger" : "neutral"}
        />
      </Section>
    </div>
  );
}
