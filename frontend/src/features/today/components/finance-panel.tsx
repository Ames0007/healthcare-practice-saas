"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import { formatMad } from "@/features/today/format";
import type { TodayFinance } from "@/features/today/types";

/**
 * Operational cash snapshot only (CLAUDE.md §19/§26/§27) — neutral
 * typography-led cards, deliberately not green/red coded (Spec #10 §22:
 * "Do not color all revenue green or all expenses red.").
 */
export function FinancePanel({ finance }: { finance: TodayFinance }) {
  const { t, locale } = useLocale();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("aujourdhui.finance.title")}
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label={t("aujourdhui.finance.collected")} value={formatMad(finance.collected, locale)} />
        <MetricCard label={t("aujourdhui.finance.pending")} value={formatMad(finance.pending, locale)} />
        <MetricCard label={t("aujourdhui.finance.expenses")} value={formatMad(finance.expenses, locale)} />
        <MetricCard label={t("aujourdhui.finance.caisse")} value={formatMad(finance.caisse, locale)} />
      </div>
    </section>
  );
}
