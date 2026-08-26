"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import { formatMad } from "@/features/finance/format";
import type { MoneyAmount } from "@/components/domain/finance/types";

export interface CaisseSummaryProps {
  opening: MoneyAmount;
  incoming: MoneyAmount;
  outgoing: MoneyAmount;
  theoretical: MoneyAmount;
}

/**
 * "CaisseSummary" (Spec #8 §69: Opening/IN/OUT/Expected — status is shown
 * separately by the page header's own StatusBadge, not a fifth card here).
 * Restrained neutral MetricCards only (UI-006C §26) — this `theoretical`
 * figure is the calculated expectation only, never the physically counted
 * balance (§25); Écart/Montant compté are UI-006E's own separate closing
 * flow (`CashCountDialog`/`ClosedCaisseSummary`), not added here.
 */
export function CaisseSummary({ opening, incoming, outgoing, theoretical }: CaisseSummaryProps) {
  const { t, locale } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard label={t("finance.caisse.summary.opening")} value={formatMad(opening, locale)} />
      <MetricCard label={t("finance.caisse.summary.incoming")} value={formatMad(incoming, locale)} />
      <MetricCard label={t("finance.caisse.summary.outgoing")} value={formatMad(outgoing, locale)} />
      <MetricCard label={t("finance.caisse.summary.theoretical")} value={formatMad(theoretical, locale)} />
    </div>
  );
}
