"use client";

import { useLocale } from "@/i18n/locale-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { AgendaAppointment } from "@/features/agenda/types";

export interface NoShowConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: AgendaAppointment | null;
  onConfirm: (appointmentId: string) => void;
}

/** No-show confirmation (§32) — danger semantics, never deletes the appointment. */
export function NoShowConfirmDialog({ open, onClose, appointment, onConfirm }: NoShowConfirmDialogProps) {
  const { t } = useLocale();

  if (!appointment) {
    return null;
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => onConfirm(appointment.id)}
      title={t("agenda.noShowConfirm.title")}
      description={t("agenda.noShowConfirm.description", { name: appointment.patientName, time: appointment.time })}
      cancelLabel={t("agenda.noShowConfirm.cancel")}
      confirmLabel={t("agenda.noShowConfirm.confirm")}
      tone="danger"
    />
  );
}
