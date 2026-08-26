"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CONTRACT_TYPE_MAP } from "@/components/domain/team/contract-type";
import type { ContractStatus, ContractType, EmploymentContractFormValues } from "@/components/domain/team/types";
import { isValidContractDateRange, isValidWeeklyHours } from "@/features/team/contracts";

export interface ContractFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: EmploymentContractFormValues) => void;
  initialValues: EmploymentContractFormValues;
  /** Read-only display context — the reference itself is immutable (mirrors `employeeNumber`, UI-007A §9). */
  contractNumber?: string;
}

const CONTRACT_TYPE_OPTIONS: ContractType[] = ["permanent", "fixed_term", "part_time", "internship", "other"];

/**
 * Bounded contract edit prototype (UI-007B §8) — edit-only, no "create a
 * new contract" flow (the task scopes this to editing the employee's
 * current contract, not authoring contract history). Mirrors
 * `TeamMemberFormDialog`'s drawer/validate/submit shape.
 */
export function ContractFormDialog({ open, onClose, onSubmit, initialValues, contractNumber }: ContractFormDialogProps) {
  const { t } = useLocale();

  const [contractType, setContractType] = useState<ContractType>(initialValues.contractType);
  const [status, setStatus] = useState<ContractStatus>(initialValues.status);
  const [jobTitle, setJobTitle] = useState(initialValues.jobTitle);
  const [startDate, setStartDate] = useState(initialValues.startDate);
  const [endDate, setEndDate] = useState(initialValues.endDate);
  const [weeklyHours, setWeeklyHours] = useState(initialValues.weeklyHours);
  const [notes, setNotes] = useState(initialValues.notes);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function buildValues(): EmploymentContractFormValues {
    return {
      contractType,
      status,
      jobTitle: jobTitle.trim(),
      startDate,
      endDate,
      weeklyHours: weeklyHours.trim(),
      notes: notes.trim(),
    };
  }

  function validate(): Record<string, string> {
    const required = t("team.form.requiredError");
    const nextErrors: Record<string, string> = {};

    if (!jobTitle.trim()) nextErrors.jobTitle = required;
    if (!startDate) nextErrors.startDate = required;
    if (startDate && endDate && !isValidContractDateRange(startDate, endDate)) {
      nextErrors.endDate = t("teamDetail.contract.form.endDateError");
    }
    if (!isValidWeeklyHours(weeklyHours)) {
      nextErrors.weeklyHours = t("teamDetail.contract.form.weeklyHoursError");
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(buildValues());
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="drawer"
      label={t("teamDetail.contract.form.title")}
      closeLabel={t("team.form.close")}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-text">{t("teamDetail.contract.form.title")}</h2>
          {contractNumber && (
            <p className="mt-1 text-sm text-text-muted" dir="ltr">
              {t("teamDetail.contract.form.contractNumberLabel", { number: contractNumber })}
            </p>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <Select
            label={t("teamDetail.contract.typeLabel")}
            required
            value={contractType}
            onChange={(event) => setContractType(event.target.value as ContractType)}
            options={CONTRACT_TYPE_OPTIONS.map((option) => ({ value: option, label: t(CONTRACT_TYPE_MAP[option].translationKey) }))}
          />
          <Select
            label={t("teamDetail.statusLabel")}
            required
            value={status}
            onChange={(event) => setStatus(event.target.value as ContractStatus)}
            options={[
              { value: "active", label: t("team.contractStatus.active") },
              { value: "ended", label: t("team.contractStatus.ended") },
            ]}
          />
          <Input
            label={t("teamDetail.contract.jobTitleLabel")}
            required
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            error={errors.jobTitle}
          />
          <Input
            type="date"
            label={t("teamDetail.startDateLabel")}
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            error={errors.startDate}
          />
          <Input
            type="date"
            label={t("teamDetail.contract.endDateLabel")}
            helperText={t("teamDetail.contract.endDateHelp")}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            error={errors.endDate}
          />
          <Input
            type="number"
            min="0"
            step="0.5"
            label={t("teamDetail.contract.weeklyHoursLabel")}
            value={weeklyHours}
            onChange={(event) => setWeeklyHours(event.target.value)}
            error={errors.weeklyHours}
          />
          <Textarea
            label={t("teamDetail.contract.notesLabel")}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("team.form.cancel")}
          </Button>
          <Button type="submit">{t("team.form.submitEdit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
