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

/**
 * Cabinet-wide "À encaisser" attention section (UI-006A §21-25). Clicking a
 * row navigates to the existing patient invoice workspace — no duplicate
 * InvoiceDetailDrawer here (§24). "Voir toutes les factures" now navigates
 * to the real global invoice workspace (UI-006B §6) instead of the
 * future-feature notice UI-006A originally showed, since that screen now
 * exists.
 */
export function ReceivablesSection({ receivables }: ReceivablesSectionProps) {
  const { t, locale } = useLocale();

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
