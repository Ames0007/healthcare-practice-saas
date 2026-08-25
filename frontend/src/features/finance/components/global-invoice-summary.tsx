"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import { formatMad } from "@/features/finance/format";
import type { FinancialSummary } from "@/features/patients/finance";

export interface GlobalInvoiceSummaryProps {
  summary: FinancialSummary;
}

/**
 * Restrained cabinet-wide totals for the filtered result set (UI-006B
 * §5/§11/§30) — reuses `getFinancialSummary` (UI-004D) unmodified, so
 * "Total facturé"/"Payé"/"Reste à encaisser"/"En retard" can never drift
 * from the same source invoices Patient 360° and the Finance dashboard
 * already show. No giant green/red cards (§11), same restrained
 * typography-emphasis convention as every other MetricCard usage.
 */
export function GlobalInvoiceSummary({ summary }: GlobalInvoiceSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard label={t("finance.invoices.summary.totalInvoiced")} value={formatMad(summary.totalAmount, locale)} />
      <MetricCard label={t("finance.invoices.summary.paid")} value={formatMad(summary.paidAmount, locale)} />
      <MetricCard label={t("finance.invoices.summary.remaining")} value={formatMad(summary.remainingAmount, locale)} />
      <MetricCard
        label={t("finance.invoices.summary.overdue")}
        value={formatMad(summary.overdueAmount, locale)}
        emphasis={summary.overdueAmount > 0 ? "danger" : "neutral"}
      />
    </div>
  );
}
