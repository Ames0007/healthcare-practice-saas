"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SchedulingFields } from "./scheduling-fields";
import { parseTimeToMinutes } from "@/features/agenda/format";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { AppointmentSchedulingType } from "@/components/domain/appointments/types";

export interface RescheduleDraft {
  date: string;
  schedulingType: AppointmentSchedulingType;
  time: string;
  endTime: string;
  durationMinutes: number;
}

export interface RescheduleResult {
  ok: boolean;
  suggestions?: string[];
}

export interface RescheduleDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: AgendaAppointment | null;
  onSubmit: (draft: RescheduleDraft) => RescheduleResult;
}

/** Bounded reschedule interaction (§30): new date + new exact time/window only. */
export function RescheduleDialog({ open, onClose, appointment, onSubmit }: RescheduleDialogProps) {
  const { t } = useLocale();
  const [date, setDate] = useState(appointment?.date ?? "");
  const [schedulingType, setSchedulingType] = useState<AppointmentSchedulingType>(appointment?.schedulingType ?? "exact");
  const [time, setTime] = useState(appointment?.time ?? "09:00");
  const [endTime, setEndTime] = useState(appointment?.endTime ?? "09:30");
  const [durationMinutes, setDurationMinutes] = useState(appointment?.durationMinutes ?? 30);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictSuggestions, setConflictSuggestions] = useState<string[] | null>(null);

  if (!appointment) {
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const required = t("agenda.form.requiredError");
    if (!date) nextErrors.date = required;
    if (!time) nextErrors.time = required;
    if (schedulingType === "window") {
      if (!endTime) {
        nextErrors.endTime = required;
      } else if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(time)) {
        nextErrors.endTime = t("agenda.form.windowRangeError");
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const result = onSubmit({ date, schedulingType, time, endTime, durationMinutes });
    setConflictSuggestions(result.ok ? null : (result.suggestions ?? []));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="modal"
      size="sm"
      label={t("agenda.reschedule.title")}
      closeLabel={t("agenda.drawer.close")}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-text">{t("agenda.reschedule.title")}</h2>
        <p className="text-sm text-text-secondary">{appointment.patientName}</p>

        <Input
          type="date"
          label={t("agenda.reschedule.dateLabel")}
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
          error={errors.date}
        />

        <SchedulingFields
          schedulingType={schedulingType}
          onSchedulingTypeChange={setSchedulingType}
          time={time}
          onTimeChange={setTime}
          endTime={endTime}
          onEndTimeChange={setEndTime}
          durationMinutes={durationMinutes}
          onDurationChange={setDurationMinutes}
          windowError={errors.endTime}
        />

        {conflictSuggestions && (
          <div className="rounded-md border border-warning bg-warning-soft p-3">
            <p className="text-sm font-medium text-warning">{t("agenda.form.conflictTitle")}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("agenda.form.cancel")}
          </Button>
          <Button type="submit">{t("agenda.reschedule.submit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
