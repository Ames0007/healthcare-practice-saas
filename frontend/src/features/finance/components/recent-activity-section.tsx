"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { EXPENSE_CATEGORY_MAP } from "@/components/domain/finance/expense-category";
import { formatDayMonth, formatMad } from "@/features/finance/format";
import type { FinancialActivity } from "@/features/finance/types";

export interface RecentActivitySectionProps {
  activity: FinancialActivity[];
}

/**
 * Cabinet-wide "Activité récente" (UI-006A §29-32) — never color/sign alone
 * (§32): every row pairs a textual type label ("Encaissement"/
 * "Décaissement") with the amount, in neutral typography (§19), never
 * green/red.
 */
export function RecentActivitySection({ activity }: RecentActivitySectionProps) {
  const { t, locale } = useLocale();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("finance.activity.title")}
      </h2>

      {activity.length === 0 ? (
        <EmptyState
          title={t("finance.activity.emptyTitle")}
          description={t("finance.activity.emptyDescription")}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {activity.map((item) => (
            <li key={item.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    {t(`finance.activity.${item.type}`)}
                  </p>
                  <p className="truncate text-sm font-medium text-text">{item.label}</p>
                  <p className="text-xs text-text-muted" dir="ltr">
                    {formatDayMonth(item.date, locale)}
                    {item.invoiceNumber && <> · {item.invoiceNumber}</>}
                    {item.category && <> · {t(EXPENSE_CATEGORY_MAP[item.category].translationKey)}</>}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-text" dir="ltr">
                  {item.direction === "in" ? "+" : "−"}
                  {formatMad(item.amount, locale)}
                </span>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
