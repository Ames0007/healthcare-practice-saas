"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PAYMENT_STATUS_MAP } from "@/components/domain/finance/payment-status";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import { formatDayMonth, formatMad } from "@/features/patients/format";

export interface PaymentDetailDrawerProps {
  payment: Payment | null;
  /** The patient's own invoices — used only to resolve the allocated invoice number/installment label, never duplicated (CLAUDE.md §12). */
  invoices: Invoice[];
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
  onFutureFeature: (message: string) => void;
}

/**
 * Payment/receipt detail (Spec #9 Screen 28, UI-004E §35-38). Read-focused —
 * no "Modifier"/"Supprimer" action anywhere, since a posted payment is
 * financially historical, not ordinary CRUD (CLAUDE.md §24). "Voir la
 * facture" only navigates to the Factures tab (§40); "Télécharger le
 * reçu"/"Imprimer" only surface a future-feature notice, never generating a
 * document (§38).
 */
export function PaymentDetailDrawer({ payment, invoices, patientId, patientName, open, onClose, onFutureFeature }: PaymentDetailDrawerProps) {
  const { t, locale } = useLocale();

  if (!payment) {
    return null;
  }

  const statusMeta = PAYMENT_STATUS_MAP[payment.status];
  const allocation = payment.allocations[0];
  const invoice = allocation ? invoices.find((candidate) => candidate.id === allocation.invoiceId) : undefined;
  const installment = invoice && allocation?.installmentId
    ? invoice.installments.find((candidate) => candidate.id === allocation.installmentId)
    : undefined;
  const heading = payment.receipt?.receiptNumber ?? payment.paymentNumber;

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={heading} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-text" dir="ltr">
              {heading}
            </h2>
            <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-text" dir="ltr">
            {formatMad(payment.amount, locale)}
          </p>
          <p className="text-sm text-text-muted">{t(`patientDetail.payments.method.${payment.method}`)}</p>
          <p className="text-sm text-text" dir="ltr">
            {formatDayMonth(payment.paymentDate, locale)}
          </p>
        </div>

        {payment.status === "reversed" && payment.reversalReason && (
          <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{payment.reversalReason}</div>
        )}

        {invoice && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("patientDetail.payments.allocationLabel")}</p>
            <p className="text-sm text-text" dir="ltr">
              {invoice.invoiceNumber}
            </p>
            {installment && (
              <p className="text-sm text-text-muted">{t("patientDetail.invoices.installmentLabel", { n: installment.sequenceNumber })}</p>
            )}
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("patientDetail.invoices.patientLabel")}</p>
          <p className="text-sm text-text">{patientName}</p>
        </div>

        {invoice && (
          <Link
            href={`/app/patients/${patientId}/invoices`}
            className="w-fit text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {t("patientDetail.invoices.viewInvoice")}
          </Link>
        )}

        {payment.status === "posted" && payment.receipt && (
          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => onFutureFeature(t("patientDetail.payments.receiptNotice"))}>
              {t("patientDetail.payments.downloadReceipt")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onFutureFeature(t("patientDetail.payments.receiptNotice"))}>
              {t("patientDetail.invoices.print")}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
