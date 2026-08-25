"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import type { FinancePeriod } from "@/features/finance/types";

const PERIOD_ORDER: FinancePeriod[] = ["today", "week", "month"];

export interface PeriodSelectorProps {
  period: FinancePeriod;
  onChange: (period: FinancePeriod) => void;
}

/** Local prototype period switching (UI-006A §15-16) — mirrors the button-group filter pattern used by Documents/Prescriptions (UI-005D). */
export function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  const { t } = useLocale();

  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-md border border-border-strong p-1"
      role="group"
      aria-label={t("finance.period.groupLabel")}
    >
      {PERIOD_ORDER.map((value) => (
        <Button
          key={value}
          type="button"
          variant={period === value ? "primary" : "ghost"}
          size="sm"
          aria-pressed={period === value}
          onClick={() => onChange(value)}
        >
          {t(`finance.period.${value}`)}
        </Button>
      ))}
    </div>
  );
}
