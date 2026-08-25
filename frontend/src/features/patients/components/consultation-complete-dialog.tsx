"use client";

import { useLocale } from "@/i18n/locale-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface ConsultationCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * "Terminer la consultation ?" confirmation (Spec §27, UI-005C §25/§27) —
 * reuses the shared `ConfirmDialog` unmodified, mirroring
 * `CancelConfirmDialog`/`NoShowConfirmDialog`'s own thin-wrapper pattern.
 * `tone="primary"`, not `"danger"` — completing a consultation is the
 * intended positive outcome, not a destructive action; it is sensitive
 * (irreversible in this prototype) rather than harmful.
 */
export function ConsultationCompleteDialog({ open, onClose, onConfirm }: ConsultationCompleteDialogProps) {
  const { t } = useLocale();

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("patientDetail.consultation.complete.title")}
      description={t("patientDetail.consultation.complete.description")}
      cancelLabel={t("patientDetail.consultation.complete.cancel")}
      confirmLabel={t("patientDetail.consultation.complete.confirm")}
      tone="primary"
    />
  );
}
