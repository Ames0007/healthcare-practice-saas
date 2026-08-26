"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import { formatMad } from "@/features/finance/format";
import type { MoneyAmount } from "@/components/domain/finance/types";

export interface ExpenseSummaryProps {
  total: MoneyAmount;
  count: number;
}

/** Restrained "TOTAL AUJOURD'HUI" summary (UI-006D §13-14, Spec #9 Screen 32) — total and count only, no charts. */
export function ExpenseSummary({ total, count }: ExpenseSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 sm:max-w-md">
      <MetricCard label={t("finance.expenses.totalTodayLabel")} value={formatMad(total, locale)} />
      <MetricCard label={t("finance.expenses.countLabel")} value={count} />
    </div>
  );
}
