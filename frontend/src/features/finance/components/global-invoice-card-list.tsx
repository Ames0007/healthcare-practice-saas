"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { INVOICE_STATUS_MAP } from "@/components/domain/finance/invoice-status";
import { formatDayMonth, formatMad } from "@/features/finance/format";
import type { GlobalInvoiceRow } from "@/features/finance/types";

export interface GlobalInvoiceCardListProps {
  rows: GlobalInvoiceRow[];
  onSelect: (invoiceId: string) => void;
}

/**
 * Mobile compact cards (UI-006B §36) — never the desktop table squeezed
 * down (§36), mirrors `PatientCardList`'s exact `divide-y ... md:hidden`
 * convention, with its own explicit "Voir" action per card (not a
 * whole-card link, so the patient-identity link above can stay a real,
 * separately focusable link).
 */
export function GlobalInvoiceCardList({ rows, onSelect }: GlobalInvoiceCardListProps) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col divide-y divide-border md:hidden">
      {rows.map((row) => {
        const statusMeta = INVOICE_STATUS_MAP[row.invoice.status];
        const nextInstallmentOverdue = row.nextInstallment?.status === "overdue";

        return (
          <div key={row.invoice.id} className="flex flex-col gap-2 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-text" dir="ltr">
                {row.invoice.invoiceNumber}
              </span>
              <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
            </div>

            <div>
              <Link href={`/app/patients/${row.patientId}`} className="font-medium text-primary hover:underline">
                {row.patientName}
              </Link>
              <p className="text-xs text-text-muted" dir="ltr">
                {row.patientNumber}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
              <div>
                <p className="text-xs text-text-muted">{t("finance.invoices.table.total")}</p>
                <p className="tabular-nums text-text-secondary" dir="ltr">
                  {formatMad(row.invoice.totalAmount, locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">{t("finance.invoices.table.paid")}</p>
                <p className="tabular-nums text-text-secondary" dir="ltr">
                  {formatMad(row.invoice.paidAmount, locale)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">{t("finance.invoices.table.remaining")}</p>
                <p className="font-medium tabular-nums text-text" dir="ltr">
                  {formatMad(row.invoice.remainingAmount, locale)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted">{t("finance.invoices.table.nextInstallment")}</p>
              {row.nextInstallment ? (
                <p className={cn("tabular-nums", nextInstallmentOverdue ? "text-danger" : "text-text-secondary")} dir="ltr">
                  {formatDayMonth(row.nextInstallment.dueDate, locale)} · {formatMad(row.nextInstallment.amount, locale)}
                </p>
              ) : (
                <p className="text-text-muted">{t("finance.invoices.noNextInstallment")}</p>
              )}
            </div>

            <Button variant="outline" size="sm" className="w-fit" onClick={() => onSelect(row.invoice.id)}>
              {t("finance.invoices.view")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
