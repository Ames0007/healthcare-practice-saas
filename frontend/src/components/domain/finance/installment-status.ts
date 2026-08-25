import { CheckCircle2, Circle, Clock, TriangleAlert, type LucideIcon } from "lucide-react";
import type { StatusTone } from "@/components/ui/status-badge";
import type { InstallmentStatus } from "./types";

interface InstallmentStatusMeta {
  tone: StatusTone;
  translationKey: string;
  icon: LucideIcon;
}

/**
 * Installment status is its own small registry (UI-004D §28), separate
 * from `InvoiceStatus` — a staged-payment obligation and its parent
 * invoice can legitimately be in different states (e.g. an "overdue"
 * installment inside a still-"partially_paid" invoice).
 */
export const INSTALLMENT_STATUS_MAP: Record<InstallmentStatus, InstallmentStatusMeta> = {
  paid: { tone: "success", translationKey: "patientDetail.invoices.installmentStatus.paid", icon: CheckCircle2 },
  due: { tone: "warning", translationKey: "patientDetail.invoices.installmentStatus.due", icon: Clock },
  overdue: { tone: "danger", translationKey: "patientDetail.invoices.installmentStatus.overdue", icon: TriangleAlert },
  future: { tone: "neutral", translationKey: "patientDetail.invoices.installmentStatus.future", icon: Circle },
};
