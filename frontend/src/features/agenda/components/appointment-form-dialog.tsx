"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { SchedulingFields } from "./scheduling-fields";
import { addMinutesToTime, parseTimeToMinutes } from "@/features/agenda/format";
import type { AgendaPatient, AgendaPractitioner, AppointmentDraft } from "@/features/agenda/types";
import type { AppointmentSchedulingType } from "@/components/domain/appointments/types";
import type { CabinetService } from "@/components/domain/settings/types";

export interface AppointmentFormResult {
  ok: boolean;
  suggestions?: string[];
}

export interface AppointmentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: AppointmentDraft) => AppointmentFormResult;
  mode: "create" | "edit";
  initialValues?: Partial<AppointmentDraft>;
  patients: AgendaPatient[];
  practitioners: AgendaPractitioner[];
  /** The real Paramètres > Services & tarifs catalog (never a second, disconnected service list — UI-014 §20/24). */
  services: CabinetService[];
}

/**
 * Create/edit appointment surface (§18-27, Spec #9 Screen 12). Plain
 * `useState` form (no form library dependency) — the parent remounts this
 * component with a fresh `key` per open, so initial values only need to
 * be read once. Conflict detection (§28) happens in the parent via
 * `onSubmit`'s return value; the dialog stays open and renders the
 * suggestions inline rather than closing on a rejected submission.
 */
export function AppointmentFormDialog({
  open,
  onClose,
  onSubmit,
  mode,
  initialValues,
  patients,
  practitioners,
  services,
}: AppointmentFormDialogProps) {
  const { t } = useLocale();

  const [patientId, setPatientId] = useState<string | null>(initialValues?.patientId ?? null);
  const [practitionerId, setPractitionerId] = useState(initialValues?.practitionerId ?? practitioners[0]?.id ?? "");
  const [service, setService] = useState(initialValues?.service ?? "");
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [schedulingType, setSchedulingType] = useState<AppointmentSchedulingType>(initialValues?.schedulingType ?? "exact");
  const [time, setTime] = useState(initialValues?.time ?? "09:00");
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? "09:30");
  const [durationMinutes, setDurationMinutes] = useState(initialValues?.durationMinutes ?? 30);
  const [initialStatus, setInitialStatus] = useState<"to_confirm" | "confirmed">(initialValues?.initialStatus ?? "to_confirm");
  const [note, setNote] = useState(initialValues?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictSuggestions, setConflictSuggestions] = useState<string[] | null>(null);
  const [showCreatePatientNotice, setShowCreatePatientNotice] = useState(false);

  const selectedService = services.find((candidate) => candidate.name === service);
  const activeServices = services.filter((candidate) => candidate.active);
  const serviceOptions =
    selectedService && !selectedService.active ? [...activeServices, selectedService] : activeServices;

  function handleServiceChange(name: string) {
    setService(name);
    const matched = services.find((candidate) => candidate.name === name);
    if (matched) {
      setDurationMinutes(matched.durationMinutes);
    }
  }

  function applySuggestion(suggestion: string) {
    if (schedulingType === "window") {
      const duration = parseTimeToMinutes(endTime) - parseTimeToMinutes(time);
      setTime(suggestion);
      setEndTime(addMinutesToTime(suggestion, duration > 0 ? duration : 30));
    } else {
      setTime(suggestion);
    }
    setConflictSuggestions(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const required = t("agenda.form.requiredError");
    if (!patientId) nextErrors.patient = required;
    if (!practitionerId) nextErrors.practitioner = required;
    if (!service) nextErrors.service = required;
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
    if (Object.keys(nextErrors).length > 0 || !patientId) {
      return;
    }

    const draft: AppointmentDraft = {
      patientId,
      practitionerId,
      service,
      date,
      schedulingType,
      time,
      endTime,
      durationMinutes,
      initialStatus,
      note,
    };

    const result = onSubmit(draft);
    setConflictSuggestions(result.ok ? null : (result.suggestions ?? []));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="modal"
      size="md"
      label={mode === "create" ? t("agenda.form.createTitle") : t("agenda.form.editTitle")}
      closeLabel={t("agenda.drawer.close")}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold text-text">
          {mode === "create" ? t("agenda.form.createTitle") : t("agenda.form.editTitle")}
        </h2>

        <div>
          <Combobox
            label={t("agenda.form.patientLabel")}
            placeholder={t("agenda.form.patientPlaceholder")}
            items={patients.map((patient) => ({ id: patient.id, label: patient.name, description: patient.phone }))}
            value={patientId}
            onChange={(id) => {
              setPatientId(id);
              setShowCreatePatientNotice(false);
            }}
            emptyMessage={t("agenda.form.patientEmpty")}
            required
            error={errors.patient}
            createLabel={t("agenda.form.createPatient")}
            onCreate={() => setShowCreatePatientNotice(true)}
          />
          {showCreatePatientNotice && (
            <p className="mt-1.5 text-sm text-text-muted">{t("agenda.form.createPatientUnavailable")}</p>
          )}
        </div>

        <Select
          label={t("agenda.form.practitionerLabel")}
          required
          value={practitionerId}
          onChange={(event) => setPractitionerId(event.target.value)}
          error={errors.practitioner}
          options={practitioners.map((practitioner) => ({ value: practitioner.id, label: practitioner.name }))}
        />

        <Select
          label={t("agenda.form.serviceLabel")}
          required
          value={service}
          onChange={(event) => handleServiceChange(event.target.value)}
          error={errors.service}
          placeholder={t("agenda.form.servicePlaceholder")}
          options={serviceOptions.map((item) => ({ value: item.name, label: item.name }))}
        />

        <Input
          type="date"
          label={t("agenda.form.dateLabel")}
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

        <Select
          label={t("agenda.form.statusLabel")}
          value={initialStatus}
          onChange={(event) => setInitialStatus(event.target.value as "to_confirm" | "confirmed")}
          options={[
            { value: "to_confirm", label: t("agenda.form.statusToConfirm") },
            { value: "confirmed", label: t("agenda.form.statusConfirmed") },
          ]}
        />

        <Input
          label={t("agenda.form.noteLabel")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {conflictSuggestions && (
          <div className="rounded-md border border-warning bg-warning-soft p-3">
            <p className="text-sm font-medium text-warning">{t("agenda.form.conflictTitle")}</p>
            {conflictSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-sm text-text-secondary">{t("agenda.form.conflictSuggestions")}</span>
                {conflictSuggestions.map((suggestion) => (
                  <Button key={suggestion} type="button" variant="outline" size="sm" onClick={() => applySuggestion(suggestion)}>
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("agenda.form.cancel")}
          </Button>
          <Button type="submit">
            {mode === "create" ? t("agenda.form.submitCreate") : t("agenda.form.submitEdit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
