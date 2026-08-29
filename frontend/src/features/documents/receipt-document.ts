import type { Installment, Invoice, Payment } from "@/components/domain/finance/types";
import type { CabinetProfile, DocumentSettings } from "@/components/domain/settings/types";
import { formatDayMonthYear } from "@/features/patients/format";
import { formatMad } from "@/features/today/format";
import { buildDocumentFilename } from "./filename";
import { createDocumentTranslator } from "./translate";
import type { GeneratedDocumentBase } from "./types";

export interface ReceiptDocumentModel extends GeneratedDocumentBase {
  type: "receipt";
  dateLabel: string;
  dateValue: string;
  patientLabel: string;
  patientName: string;
  patientNumberLabel: string;
  patientNumber: string;
  amountLabel: string;
  /** Reconciled 1:1 against `Payment.amount` — never recomputed (task §17/§18). */
  amount: number;
  amountValueLabel: string;
  methodLabel: string;
  methodValueLabel: string;
  invoiceLabel?: string;
  invoiceValueLabel?: string;
  prototypeNotice: string;
}

/**
 * Pure payment/receipt → document projection (task §18). Only called for a
 * `posted` payment carrying a `Receipt` — a reversed payment has no
 * receipt to print/download (`payment-detail-drawer.tsx` already guards
 * this before rendering the action buttons).
 */
export function buildReceiptDocument(
  payment: Payment,
  patientName: string,
  patientNumber: string,
  cabinet: CabinetProfile,
  documentSettings: DocumentSettings,
  methodValueLabel: string,
  relatedInvoice?: Invoice,
  relatedInstallment?: Installment,
  installmentLabel?: string,
): ReceiptDocumentModel {
  const locale = documentSettings.documentLanguage;
  const t = createDocumentTranslator(locale);
  const receiptNumber = payment.receipt?.receiptNumber ?? payment.paymentNumber;

  return {
    type: "receipt",
    reference: receiptNumber,
    title: t("documents.receipt.title"),
    filename: buildDocumentFilename("Recu", receiptNumber),
    locale,
    generatedAtPrototype: new Date().toISOString(),
    sourceRecordId: payment.id,
    cabinet: {
      name: cabinet.name,
      address: cabinet.address,
      city: cabinet.city,
      phone: cabinet.phone,
      email: cabinet.email,
    },
    headerNote: documentSettings.headerNote,
    footerText: documentSettings.footerText,
    dateLabel: t("documents.receipt.dateLabel"),
    dateValue: formatDayMonthYear(payment.paymentDate, locale),
    patientLabel: t("documents.receipt.patientLabel"),
    patientName,
    patientNumberLabel: t("documents.receipt.patientNumberLabel"),
    patientNumber,
    amountLabel: t("documents.receipt.amountLabel"),
    amount: payment.amount,
    amountValueLabel: formatMad(payment.amount, locale),
    methodLabel: t("documents.receipt.methodLabel"),
    methodValueLabel,
    invoiceLabel: relatedInvoice ? t("documents.receipt.invoiceLabel") : undefined,
    invoiceValueLabel: relatedInvoice
      ? relatedInstallment && installmentLabel
        ? `${relatedInvoice.invoiceNumber} — ${installmentLabel}`
        : relatedInvoice.invoiceNumber
      : undefined,
    prototypeNotice: t("documents.prototypeNotice"),
  };
}
