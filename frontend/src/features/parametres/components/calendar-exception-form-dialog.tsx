"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AgendaAppointment } from "@/features/agenda/types";
import type {
  CabinetCalendarException,
  CabinetWorkingHoursDay,
  CalendarExceptionFormValues,
} from "@/components/domain/settings/types";
import { CALENDAR_EXCEPTION_TYPE_MAP, CALENDAR_EXCEPTION_TYPE_ORDER } from "@/components/domain/settings/calendar-exception-type";
import {
  buildCalendarExceptionFromFormValues,
  buildInitialCalendarExceptionFormValues,
  findConflictingAppointments,
  isClosedExceptionType,
  resolveEffectiveCabinetAvailability,
  validateCalendarExceptionForm,
} from "../calendar-exceptions";

export interface CalendarExceptionFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (exception: CabinetCalendarException) => void;
  existing?: CabinetCalendarException;
  exceptions: CabinetCalendarException[];
  workingHours: CabinetWorkingHoursDay[];
  appointments: AgendaAppointment[];
}

function formatIntervals(intervals: { startTime: string; endTime: string }[]): string {
  return intervals.map((interval) => `${interval.startTime}–${interval.endTime}`).join(", ");
}

/**
 * Add/Edit Calendar Exception (UI-AGENDA-X §13-14/§21-24). Shows a real
 * NORMAL vs EXCEPTION comparison (task §21) and, once a date is chosen,
 * a real appointment-conflict warning (task §22-24, `findConflictingAppointments`)
 * — never fabricated, always derived from the actual Agenda fixtures. The
 * warning never blocks submission and creation/editing never mutates a
 * single appointment (task's own explicit "do not silently delete/
 * reschedule them").
 */
export function CalendarExceptionFormDialog({
  open,
  onClose,
  onSubmit,
  existing,
  exceptions,
  workingHours,
  appointments,
}: CalendarExceptionFormDialogProps) {
  const { t } = useLocale();
  const [values, setValues] = useState<CalendarExceptionFormValues>(() => buildInitialCalendarExceptionFormValues(existing));
  const [errors, setErrors] = useState<{ date?: string; intervals?: string; duplicate?: string }>({});

  const isEdit = Boolean(existing);
  const closed = isClosedExceptionType(values.type);

  function handleClose() {
    setValues(buildInitialCalendarExceptionFormValues(existing));
    setErrors({});
    onClose();
  }

  function handleTypeChange(type: CalendarExceptionFormValues["type"]) {
    setValues((current) => ({ ...current, type, intervals: CALENDAR_EXCEPTION_TYPE_MAP[type].isClosed ? [] : current.intervals }));
  }

  function addInterval() {
    setValues((current) => ({ ...current, intervals: [...current.intervals, { startTime: "", endTime: "" }] }));
  }

  function removeInterval(index: number) {
    setValues((current) => ({ ...current, intervals: current.intervals.filter((_, i) => i !== index) }));
  }

  function updateInterval(index: number, field: "startTime" | "endTime", value: string) {
    setValues((current) => ({
      ...current,
      intervals: current.intervals.map((interval, i) => (i === index ? { ...interval, [field]: value } : interval)),
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateCalendarExceptionForm(values, exceptions, existing?.id, {
      dateRequired: t("parametres.horaires.exceptions.form.dateRequiredError"),
      intervalsRequired: t("parametres.horaires.exceptions.form.intervalsRequiredError"),
      intervalsInvalid: t("parametres.horaires.exceptions.form.intervalsInvalidError"),
      duplicateDate: t("parametres.horaires.exceptions.form.duplicateDateError"),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit(buildCalendarExceptionFromFormValues(values, existing?.id ?? `cal-exc-${Date.now()}`, existing?.createdAt ?? new Date().toISOString().slice(0, 10)));
  }

  const normalAvailability = values.date ? resolveEffectiveCabinetAvailability(values.date, workingHours, []) : null;
  const exceptionAvailability = values.date
    ? { isOpen: !closed, intervals: closed ? [] : values.intervals }
    : null;
  const conflicts =
    values.date && exceptionAvailability
      ? findConflictingAppointments(
          values.date,
          { date: values.date, source: "calendar_exception", ...exceptionAvailability },
          appointments,
        )
      : [];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      variant="modal"
      size="md"
      label={isEdit ? t("parametres.horaires.exceptions.form.editTitle") : t("parametres.horaires.exceptions.form.addTitle")}
      closeLabel={t("parametres.horaires.exceptions.form.close")}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-text">
          {isEdit ? t("parametres.horaires.exceptions.form.editTitle") : t("parametres.horaires.exceptions.form.addTitle")}
        </h2>

        <Input
          type="date"
          label={t("parametres.horaires.exceptions.form.dateLabel")}
          required
          value={values.date}
          onChange={(event) => setValues((current) => ({ ...current, date: event.target.value }))}
          error={errors.date ?? errors.duplicate}
        />

        <Select
          label={t("parametres.horaires.exceptions.form.typeLabel")}
          required
          value={values.type}
          onChange={(event) => handleTypeChange(event.target.value as CalendarExceptionFormValues["type"])}
          options={CALENDAR_EXCEPTION_TYPE_ORDER.map((type) => ({ value: type, label: t(CALENDAR_EXCEPTION_TYPE_MAP[type].translationKey) }))}
        />

        <Input
          label={t("parametres.horaires.exceptions.form.reasonLabel")}
          placeholder={t("parametres.horaires.exceptions.form.reasonPlaceholder")}
          value={values.reason}
          onChange={(event) => setValues((current) => ({ ...current, reason: event.target.value }))}
        />

        {!closed && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-secondary">{t("parametres.horaires.exceptions.form.intervalsHeading")}</span>
            {values.intervals.map((interval, index) => (
              <div key={index} className="flex flex-wrap items-end gap-2">
                <Input
                  type="time"
                  label={t("parametres.horaires.exceptions.form.startLabel")}
                  value={interval.startTime}
                  onChange={(event) => updateInterval(index, "startTime", event.target.value)}
                />
                <Input
                  type="time"
                  label={t("parametres.horaires.exceptions.form.endLabel")}
                  value={interval.endTime}
                  onChange={(event) => updateInterval(index, "endTime", event.target.value)}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeInterval(index)}>
                  {t("parametres.horaires.exceptions.form.removeInterval")}
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-fit" onClick={addInterval}>
              {t("parametres.horaires.exceptions.form.addInterval")}
            </Button>
            {errors.intervals && <p className="text-sm text-danger">{errors.intervals}</p>}
          </div>
        )}

        {normalAvailability && exceptionAvailability && (
          <div className="grid grid-cols-1 gap-3 rounded-md border border-border bg-surface-subtle p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="font-medium text-text-secondary">{t("parametres.horaires.exceptions.form.normalHeading")}</p>
              <p dir="ltr" className="text-text">
                {normalAvailability.isOpen ? formatIntervals(normalAvailability.intervals) : t("parametres.horaires.exceptions.closedLabel")}
              </p>
            </div>
            <div>
              <p className="font-medium text-text-secondary">{t("parametres.horaires.exceptions.form.effectiveHeading")}</p>
              <p dir="ltr" className="text-text">
                {exceptionAvailability.isOpen ? formatIntervals(exceptionAvailability.intervals) : t("parametres.horaires.exceptions.closedLabel")}
              </p>
            </div>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-text">
            <p>{t("parametres.horaires.exceptions.form.conflictWarning", { count: conflicts.length })}</p>
            <Link href="/app/agenda" className="mt-1 inline-block font-medium text-primary hover:underline">
              {t("parametres.horaires.exceptions.form.viewAppointments")}
            </Link>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("parametres.horaires.exceptions.form.cancel")}
          </Button>
          <Button type="submit">{t("parametres.horaires.exceptions.form.save")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
