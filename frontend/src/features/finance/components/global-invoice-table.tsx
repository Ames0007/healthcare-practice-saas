"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { INVOICE_STATUS_MAP } from "@/components/domain/finance/invoice-status";
import { formatDayMonth, formatMad } from "@/features/finance/format";
import type { GlobalInvoiceRow } from "@/features/finance/types";

export interface GlobalInvoiceTableProps {
  rows: GlobalInvoiceRow[];
  onSelect: (invoiceId: string) => void;
}

/**
 * Desktop table (UI-006B §17/§37) — mirrors `PatientTable`'s exact
 * `hidden overflow-x-auto md:block` dual-render convention. Date/Total/Payé
 * are secondary columns hidden at tablet width (`lg:table-cell`) since
 * Patient/Invoice/Remaining/Next installment/Status are the ones the task
 * calls out as more important (§37) — no horizontal scrolling forced at
 * `md`.
 */
export function GlobalInvoiceTable({ rows, onSelect }: GlobalInvoiceTableProps) {
  const { t, locale } = useLocale();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
            <th className="px-4 py-3 text-start">{t("finance.invoices.table.invoice")}</th>
            <th className="px-4 py-3 text-start">{t("finance.invoices.table.patient")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("finance.invoices.table.date")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("finance.invoices.table.total")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("finance.invoices.table.paid")}</th>
            <th className="px-4 py-3 text-start">{t("finance.invoices.table.remaining")}</th>
            <th className="px-4 py-3 text-start">{t("finance.invoices.table.nextInstallment")}</th>
            <th className="px-4 py-3 text-start">{t("finance.invoices.table.status")}</th>
            <th className="px-4 py-3 text-start">
              <span className="sr-only">{t("finance.invoices.table.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const statusMeta = INVOICE_STATUS_MAP[row.invoice.status];
            const nextInstallmentOverdue = row.nextInstallment?.status === "overdue";

            return (
              <tr key={row.invoice.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 font-medium text-text" dir="ltr">
                  {row.invoice.invoiceNumber}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/app/patients/${row.patientId}`} className="font-medium text-primary hover:underline">
                    {row.patientName}
                  </Link>
                  <p className="text-xs text-text-muted" dir="ltr">
                    {row.patientNumber}
                  </p>
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-text-secondary lg:table-cell" dir="ltr">
                  {formatDayMonth(row.invoice.issuedDate, locale)}
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-text-secondary lg:table-cell" dir="ltr">
                  {formatMad(row.invoice.totalAmount, locale)}
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-text-secondary lg:table-cell" dir="ltr">
                  {formatMad(row.invoice.paidAmount, locale)}
                </td>
                <td className="px-4 py-3 font-medium tabular-nums text-text" dir="ltr">
                  {formatMad(row.invoice.remainingAmount, locale)}
                </td>
                <td className="px-4 py-3 tabular-nums" dir="ltr">
                  {row.nextInstallment ? (
                    <span className={cn(nextInstallmentOverdue ? "text-danger" : "text-text-secondary")}>
                      {formatDayMonth(row.nextInstallment.dueDate, locale)} · {formatMad(row.nextInstallment.amount, locale)}
                    </span>
                  ) : (
                    <span className="text-text-muted">{t("finance.invoices.noNextInstallment")}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-end">
                  <Button variant="outline" size="sm" onClick={() => onSelect(row.invoice.id)}>
                    {t("finance.invoices.view")}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
