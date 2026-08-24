"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import type { AgendaAppointment } from "@/features/agenda/types";

export interface CancelConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: AgendaAppointment | null;
  onConfirm: (appointmentId: string, reason: "cancelled_by_patient" | "cancelled_by_practice", note: string) => void;
}

/** Cancellation confirmation (§31, Spec #9 §67 pattern) — never deletes the appointment. */
export function CancelConfirmDialog({ open, onClose, appointment, onConfirm }: CancelConfirmDialogProps) {
  const { t } = useLocale();
  const [reason, setReason] = useState<"cancelled_by_patient" | "cancelled_by_practice">("cancelled_by_patient");
  const [note, setNote] = useState("");

  if (!appointment) {
    return null;
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={() => onConfirm(appointment.id, reason, note)}
      title={t("agenda.cancel.title")}
      description={t("agenda.cancel.description", { name: appointment.patientName, time: appointment.time })}
      cancelLabel={t("agenda.cancel.back")}
      confirmLabel={t("agenda.cancel.confirm")}
      tone="danger"
    >
      <div className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-text-secondary">{t("agenda.cancel.reasonLabel")}</legend>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="radio"
              name="cancel-reason"
              checked={reason === "cancelled_by_patient"}
              onChange={() => setReason("cancelled_by_patient")}
              className="h-4 w-4 accent-primary"
            />
            {t("agenda.cancel.reasonByPatient")}
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="radio"
              name="cancel-reason"
              checked={reason === "cancelled_by_practice"}
              onChange={() => setReason("cancelled_by_practice")}
              className="h-4 w-4 accent-primary"
            />
            {t("agenda.cancel.reasonByPractice")}
          </label>
        </fieldset>
        <Input label={t("agenda.cancel.noteLabel")} value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
    </ConfirmDialog>
  );
}
