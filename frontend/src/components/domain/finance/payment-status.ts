import type { StatusTone } from "@/components/ui/status-badge";
import type { PaymentStatus } from "./types";

interface PaymentStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central payment status → tone/label registry (UI-004E §21), mirroring `invoice-status.ts`/`installment-status.ts`'s pattern. */
export const PAYMENT_STATUS_MAP: Record<PaymentStatus, PaymentStatusMeta> = {
  posted: { tone: "success", translationKey: "patientDetail.payments.status.posted" },
  reversed: { tone: "danger", translationKey: "patientDetail.payments.status.reversed" },
};
