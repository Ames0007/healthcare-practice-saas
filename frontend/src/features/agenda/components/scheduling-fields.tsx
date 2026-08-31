"use client";

import { useId } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AppointmentSchedulingType } from "@/components/domain/appointments/types";

export interface SchedulingFieldsProps {
  schedulingType: AppointmentSchedulingType;
  onSchedulingTypeChange: (type: AppointmentSchedulingType) => void;
  time: string;
  onTimeChange: (value: string) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  durationMinutes: number;
  onDurationChange: (value: number) => void;
  windowError?: string;
}

/** 20 min is included alongside the original 15/30/45/60 set so a service's real Paramètres duration (e.g. Contrôle, 20 min) is always a selectable, exact option (UI-014 §20/24). */
const DURATION_OPTIONS = [15, 20, 30, 45, 60].map((minutes) => ({ value: String(minutes), label: `${minutes} min` }));

/**
 * Exact-time vs arrival-window fields (§23-25), shared by the create/edit
 * form and the reschedule dialog — one implementation of this genuinely
 * core distinction (CLAUDE.md §15), not two.
 */
export function SchedulingFields({
  schedulingType,
  onSchedulingTypeChange,
  time,
  onTimeChange,
  endTime,
  onEndTimeChange,
  durationMinutes,
  onDurationChange,
  windowError,
}: SchedulingFieldsProps) {
  const { t } = useLocale();
  const radioName = useId();

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-text-secondary">{t("agenda.form.typeLabel")}</legend>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="radio"
              name={radioName}
              checked={schedulingType === "exact"}
              onChange={() => onSchedulingTypeChange("exact")}
              className="h-4 w-4 accent-primary"
            />
            {t("agenda.form.typeExact")}
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="radio"
              name={radioName}
              checked={schedulingType === "window"}
              onChange={() => onSchedulingTypeChange("window")}
              className="h-4 w-4 accent-primary"
            />
            {t("agenda.form.typeWindow")}
          </label>
        </div>
      </fieldset>

      {schedulingType === "exact" ? (
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="time"
            label={t("agenda.form.timeLabel")}
            required
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
          />
          <Select
            label={t("agenda.form.durationLabel")}
            value={String(durationMinutes)}
            onChange={(event) => onDurationChange(Number(event.target.value))}
            options={DURATION_OPTIONS}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="time"
            label={t("agenda.form.windowStartLabel")}
            required
            value={time}
            onChange={(event) => onTimeChange(event.target.value)}
          />
          <Input
            type="time"
            label={t("agenda.form.windowEndLabel")}
            required
            value={endTime}
            onChange={(event) => onEndTimeChange(event.target.value)}
            error={windowError}
          />
        </div>
      )}
    </div>
  );
}
