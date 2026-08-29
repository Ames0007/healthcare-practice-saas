import type { Invoice } from "@/components/domain/finance/types";
import type { CabinetProfile, DocumentSettings } from "@/components/domain/settings/types";
import { INVOICE_STATUS_MAP } from "@/components/domain/finance/invoice-status";
import { formatDayMonthYear } from "@/features/patients/format";
import { formatMad } from "@/features/today/format";
import { buildDocumentFilename } from "./filename";
import { createDocumentTranslator } from "./translate";
import type { GeneratedDocumentBase } from "./types";

export interface InvoiceDocumentLine {
  id: string;
  label: string;
  quantity: number;
  totalAmountLabel: string;
}

export interface InvoiceDocumentModel extends GeneratedDocumentBase {
  type: "invoice";
  dateLabel: string;
  dateValue: string;
  patientLabel: string;
  patientName: string;
  patientNumberLabel: string;
  patientNumber: string;
  practitionerLabel: string;
  practitionerName: string;
  descriptionHeader: string;
  quantityHeader: string;
  amountHeader: string;
  lines: InvoiceDocumentLine[];
  totalLabel: string;
  /** Reconciled 1:1 against `Invoice.totalAmount` — never recomputed from `lines` (task §17). */
  totalAmount: number;
  totalAmountLabel: string;
  paidLabel: string;
  paidAmount: number;
  paidAmountLabel: string;
  remainingLabel: string;
  remainingAmount: number;
  remainingAmountLabel: string;
  statusLabel: string;
  statusValueLabel: string;
  prototypeNotice: string;
}

/**
 * Pure invoice → document projection (task §16/§17). Every money/date value
 * is read directly off the existing `Invoice`, never recalculated with a
 * different formula — `totalAmount`/`paidAmount`/`remainingAmount` reconcile
 * 1:1 against the source record by construction.
 */
export function buildInvoiceDocument(
  invoice: Invoice,
  patientName: string,
  patientNumber: string,
  cabinet: CabinetProfile,
  documentSettings: DocumentSettings,
): InvoiceDocumentModel {
  const locale = documentSettings.documentLanguage;
  const t = createDocumentTranslator(locale);

  return {
    type: "invoice",
    reference: invoice.invoiceNumber,
    title: t("documents.invoice.title"),
    filename: buildDocumentFilename("Facture", invoice.invoiceNumber),
    locale,
    generatedAtPrototype: new Date().toISOString(),
    sourceRecordId: invoice.id,
    cabinet: {
      name: cabinet.name,
      address: cabinet.address,
      city: cabinet.city,
      phone: cabinet.phone,
      email: cabinet.email,
    },
    headerNote: documentSettings.headerNote,
    footerText: documentSettings.footerText,
    dateLabel: t("documents.invoice.dateLabel"),
    dateValue: formatDayMonthYear(invoice.issuedDate, locale),
    patientLabel: t("documents.invoice.patientLabel"),
    patientName,
    patientNumberLabel: t("documents.invoice.patientNumberLabel"),
    patientNumber,
    practitionerLabel: t("documents.invoice.practitionerLabel"),
    practitionerName: invoice.practitionerName,
    descriptionHeader: t("documents.invoice.descriptionHeader"),
    quantityHeader: t("documents.invoice.quantityHeader"),
    amountHeader: t("documents.invoice.amountHeader"),
    lines: invoice.lines.map((line) => ({
      id: line.id,
      label: line.label,
      quantity: line.quantity,
      totalAmountLabel: formatMad(line.totalAmount, locale),
    })),
    totalLabel: t("documents.invoice.totalLabel"),
    totalAmount: invoice.totalAmount,
    totalAmountLabel: formatMad(invoice.totalAmount, locale),
    paidLabel: t("documents.invoice.paidLabel"),
    paidAmount: invoice.paidAmount,
    paidAmountLabel: formatMad(invoice.paidAmount, locale),
    remainingLabel: t("documents.invoice.remainingLabel"),
    remainingAmount: invoice.remainingAmount,
    remainingAmountLabel: formatMad(invoice.remainingAmount, locale),
    statusLabel: t("documents.invoice.statusLabel"),
    statusValueLabel: t(INVOICE_STATUS_MAP[invoice.status].translationKey),
    prototypeNotice: t("documents.prototypeNotice"),
  };
}
