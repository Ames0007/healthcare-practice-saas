import type { StatusTone } from "@/components/ui/status-badge";
import type { InvoiceStatus } from "./types";

interface InvoiceStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central invoice status → tone/label registry (UI-004D §22), mirroring `appointment-status.ts`/`treatment-status.ts`'s pattern. */
export const INVOICE_STATUS_MAP: Record<InvoiceStatus, InvoiceStatusMeta> = {
  draft: { tone: "neutral", translationKey: "patientDetail.invoices.status.draft" },
  issued: { tone: "info", translationKey: "patientDetail.invoices.status.issued" },
  partially_paid: { tone: "warning", translationKey: "patientDetail.invoices.status.partiallyPaid" },
  paid: { tone: "success", translationKey: "patientDetail.invoices.status.paid" },
  overdue: { tone: "danger", translationKey: "patientDetail.invoices.status.overdue" },
  cancelled: { tone: "neutral", translationKey: "patientDetail.invoices.status.cancelled" },
};
