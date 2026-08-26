"use client";

import { useLocale } from "@/i18n/locale-provider";
import { MetricCard } from "@/components/ui/metric-card";
import { formatDayMonthYear, formatMad } from "@/features/finance/format";
import type { CashSession, MoneyAmount } from "@/components/domain/finance/types";

export interface ClosedCaisseSummaryProps {
  session: CashSession;
  incoming: MoneyAmount;
  outgoing: MoneyAmount;
}

/**
 * Read-only closing summary (UI-006E §25, Spec #9 Screen 30/31's own
 * recap). Opening/Encaissements/Décaissements are still derived live from
 * `movements` (the underlying posted fixtures never change, so this is
 * safe) — Solde théorique/Espèces comptées/Écart come from the session's
 * own frozen closing fields, never recomputed, since a closed session's
 * closing figures are financial history (CLAUDE.md §24). No edit, no
 * reopen action anywhere in this component.
 */
export function ClosedCaisseSummary({ session, incoming, outgoing }: ClosedCaisseSummaryProps) {
  const { t, locale } = useLocale();
  const differenceAmount = session.differenceAmount ?? 0;
  const differenceEmphasis = session.differenceType === "shortage" ? "danger" : session.differenceType === "overage" ? "warning" : "neutral";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-text-muted" dir="ltr">
        {formatDayMonthYear(session.businessDate, locale)}
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("finance.caisse.openedAtLabel")}</p>
          <p className="text-text" dir="ltr">
            {session.openedAt}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("finance.caisse.openedByLabel")}</p>
          <p className="text-text">{session.openedBy}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("finance.caisse.closing.closedAtLabel")}
          </p>
          <p className="text-text" dir="ltr">
            {session.closedAt}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("finance.caisse.closing.closedByLabel")}
          </p>
          <p className="text-text">{session.closedBy}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("finance.caisse.closing.summaryTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <MetricCard label={t("finance.caisse.summary.opening")} value={formatMad(session.openingBalance, locale)} />
          <MetricCard label={t("finance.caisse.summary.incoming")} value={formatMad(incoming, locale)} />
          <MetricCard label={t("finance.caisse.summary.outgoing")} value={formatMad(outgoing, locale)} />
          <MetricCard
            label={t("finance.caisse.summary.theoretical")}
            value={formatMad(session.expectedClosingBalance ?? 0, locale)}
          />
          <MetricCard
            label={t("finance.caisse.closing.physicalCountLabel")}
            value={formatMad(session.physicalClosingBalance ?? 0, locale)}
          />
          <MetricCard
            label={t("finance.caisse.closing.differenceLabel")}
            value={`${differenceAmount > 0 ? "+" : ""}${formatMad(differenceAmount, locale)}`}
            emphasis={differenceEmphasis}
          />
        </div>
      </div>

      {session.discrepancyReason && (
        <div className="flex flex-col gap-1 border-t border-border pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t("finance.caisse.closing.reasonSectionTitle")}
          </h2>
          <p className="text-sm text-text">{session.discrepancyReason}</p>
        </div>
      )}
    </div>
  );
}
