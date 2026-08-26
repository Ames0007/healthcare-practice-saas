"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { buttonClassNames } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { INVOICE_STATUS_MAP } from "@/components/domain/finance/invoice-status";
import { formatDayMonth, formatMad } from "@/features/finance/format";
import type { ReceivableItem } from "@/features/finance/types";

export interface ReceivablesSectionProps {
  receivables: ReceivableItem[];
}

/** Overdue-vs-to-collect split (UI-006X §23), derived from the already-computed `receivables` read model — never a new total. */
function summarizeAttention(receivables: ReceivableItem[]) {
  const overdue = receivables.filter((item) => item.status === "overdue");
  const toCollect = receivables.filter((item) => item.status !== "overdue");
  return {
    overdueCount: overdue.length,
    overdueTotal: overdue.reduce((sum, item) => sum + item.remainingAmount, 0),
    toCollectCount: toCollect.length,
    toCollectTotal: toCollect.reduce((sum, item) => sum + item.remainingAmount, 0),
  };
}

/**
 * Cabinet-wide "À traiter" attention section (UI-006A §21-25, reframed by
 * UI-006X §23 with an overdue-vs-to-collect summary line derived from the
 * same `receivables` read model — not a new financial total). Clicking a
 * row navigates to the existing patient invoice workspace — no duplicate
 * InvoiceDetailDrawer here (§24). "Voir toutes les factures" navigates to
 * the real global invoice workspace (UI-006B §6).
 */
export function ReceivablesSection({ receivables }: ReceivablesSectionProps) {
  const { t, locale } = useLocale();
  const { overdueCount, overdueTotal, toCollectCount, toCollectTotal } = summarizeAttention(receivables);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("finance.receivables.title")}
        </h2>
        <Link href="/app/finance/invoices" className={buttonClassNames("outline", "sm")}>
          {t("finance.receivables.viewAllAction")}
        </Link>
      </div>

      {receivables.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-secondary">
          <p>
            {t("finance.receivables.overdueCount", { count: overdueCount })}{" "}
            <span className="font-medium text-text" dir="ltr">
              {formatMad(overdueTotal, locale)}
            </span>
          </p>
          <p>
            {t("finance.receivables.toCollectCount", { count: toCollectCount })}{" "}
            <span className="font-medium text-text" dir="ltr">
              {formatMad(toCollectTotal, locale)}
            </span>
          </p>
        </div>
      )}

      {receivables.length === 0 ? (
        <p className="text-sm text-text-muted">{t("finance.receivables.emptyTitle")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {receivables.map((item) => {
            const statusMeta = INVOICE_STATUS_MAP[item.status];
            return (
              <li key={item.invoiceId}>
                <Link
                  href={`/app/patients/${item.patientId}/invoices`}
                  aria-label={t("finance.receivables.viewInvoiceAriaLabel", {
                    invoiceNumber: item.invoiceNumber,
                    patientName: item.patientName,
                  })}
                  className="block"
                >
                  <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:bg-surface-subtle">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">{item.patientName}</p>
                      <p className="text-xs text-text-muted" dir="ltr">
                        {item.invoiceNumber}
                        {item.dueDate && <> · {formatDayMonth(item.dueDate, locale)}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-text" dir="ltr">
                        {formatMad(item.remainingAmount, locale)}
                      </span>
                      <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
