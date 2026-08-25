"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button, buttonClassNames } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { INVOICE_STATUS_MAP } from "@/components/domain/finance/invoice-status";
import { InstallmentRow } from "@/components/domain/finance/installment-row";
import type { Invoice } from "@/components/domain/finance/types";
import { formatDayMonth, formatMad } from "@/features/patients/format";
import { getTreatmentPlansMockData } from "@/features/patients/mock-treatments-data";

export interface InvoiceDetailDrawerProps {
  invoice: Invoice | null;
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
  onFutureFeature: (message: string) => void;
  /**
   * Global Finance only (UI-006B §21-23) — renders "Ouvrir le patient"/
   * "Voir les factures du patient" quick-navigation links. Omitted by
   * Patient 360°'s own Factures tab (`patient-invoices-content.tsx`),
   * where the user is already on that patient's page, so those links
   * would be redundant; defaulting to `false` keeps that usage's existing
   * behavior byte-for-byte unchanged.
   */
  showPatientNavigation?: boolean;
}

/**
 * Invoice detail (Spec #9 Screens 25-26/29, UI-004D §24-27). Reuses the
 * shared `Dialog` drawer unmodified — no accounting journal, no payment
 * form; "Encaisser" only navigates to the existing Payments tab (UI-004E
 * owns real collection), and "Télécharger PDF"/"Imprimer" only surface a
 * future-feature notice (§35), never generating a document. Shared
 * unmodified between Patient 360°'s Factures tab and Global Finance
 * (UI-006B §21) — this component never assumed Patient 360° page
 * composition to begin with (only pre-resolved props), so the only change
 * needed was the additive `showPatientNavigation` prop above.
 */
export function InvoiceDetailDrawer({
  invoice,
  patientId,
  patientName,
  open,
  onClose,
  onFutureFeature,
  showPatientNavigation = false,
}: InvoiceDetailDrawerProps) {
  const { t, locale } = useLocale();

  if (!invoice) {
    return null;
  }

  const statusMeta = INVOICE_STATUS_MAP[invoice.status];
  const canCollect = invoice.remainingAmount > 0 && invoice.status !== "cancelled";
  const treatmentPlan = invoice.treatmentPlanId
    ? getTreatmentPlansMockData().find((plan) => plan.id === invoice.treatmentPlanId)
    : undefined;
  const installmentsTotal = invoice.installments.reduce((sum, installment) => sum + installment.amount, 0);

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={invoice.invoiceNumber} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-text" dir="ltr">
              {invoice.invoiceNumber}
            </h2>
            <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
          </div>
          <p className="mt-2 text-sm text-text" dir="ltr">
            {t("patientDetail.invoices.issuedOn", { date: formatDayMonth(invoice.issuedDate, locale) })}
          </p>
          <p className="text-sm text-text-muted">
            {t("patientDetail.invoices.patientLabel")}: {patientName}
          </p>
          <p className="text-sm text-text-muted">{invoice.practitionerName}</p>
          <p className="mt-2 text-sm text-text">{invoice.description}</p>
          {treatmentPlan && (
            <Link
              href={`/app/patients/${patientId}/treatments`}
              className="mt-1 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("patientDetail.treatments.viewTreatment")}
            </Link>
          )}
          {showPatientNavigation && (
            <div className="mt-2 flex flex-wrap gap-4">
              <Link
                href={`/app/patients/${patientId}`}
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                {t("finance.invoices.openPatient")}
              </Link>
              <Link
                href={`/app/patients/${patientId}/invoices`}
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                {t("finance.invoices.patientInvoices")}
              </Link>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            <span>{t("patientDetail.invoices.descriptionHeader")}</span>
            <span className="flex gap-6">
              <span>{t("patientDetail.invoices.quantityHeader")}</span>
              <span>{t("patientDetail.invoices.totalHeader")}</span>
            </span>
          </div>
          {invoice.lines.map((line) => (
            <div key={line.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm last:border-b-0">
              <span className="min-w-0 flex-1 text-text">{line.label}</span>
              <span className="flex gap-6 tabular-nums" dir="ltr">
                <span className="text-text-muted">{line.quantity}</span>
                <span className="font-medium text-text">{formatMad(line.totalAmount, locale)}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-text">{t("patientDetail.invoices.totalRowLabel")}</span>
            <span className="font-semibold tabular-nums text-text" dir="ltr">
              {formatMad(invoice.totalAmount, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">{t("patientDetail.invoices.paidLabel")}</span>
            <span className="tabular-nums text-text" dir="ltr">
              {formatMad(invoice.paidAmount, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted">{t("patientDetail.invoices.remainingRowLabel")}</span>
            <span className="tabular-nums text-text" dir="ltr">
              {formatMad(invoice.remainingAmount, locale)}
            </span>
          </div>
        </div>

        {canCollect && (
          <Link href={`/app/patients/${patientId}/payments`} className={buttonClassNames("primary", "sm", "w-fit")}>
            {t("patientDetail.header.collectPayment")}
          </Link>
        )}

        {invoice.installments.length > 0 && (
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                {t("patientDetail.invoices.installmentScheduleTitle")}
              </h3>
              <span className="text-xs text-text-muted" dir="ltr">
                {t("patientDetail.invoices.installmentScheduleTotal", { total: formatMad(installmentsTotal, locale) })}
              </span>
            </div>
            <ol className="mt-2">
              {invoice.installments.map((installment) => (
                <InstallmentRow
                  key={installment.id}
                  sequenceNumber={installment.sequenceNumber}
                  dueDateLabel={formatDayMonth(installment.dueDate, locale)}
                  amountLabel={formatMad(installment.amount, locale)}
                  status={installment.status}
                  downPaymentCaption={
                    installment.sequenceNumber === 1 && installment.paidDate === invoice.issuedDate
                      ? t("patientDetail.invoices.downPaymentCaption")
                      : undefined
                  }
                />
              ))}
            </ol>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFutureFeature(t("patientDetail.invoices.documentNotice"))}
          >
            {t("patientDetail.invoices.downloadPdf")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFutureFeature(t("patientDetail.invoices.documentNotice"))}
          >
            {t("patientDetail.invoices.print")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
