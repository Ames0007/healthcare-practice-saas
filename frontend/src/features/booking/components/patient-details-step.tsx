"use client";

import type { FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContactFormErrors, ContactFormValues } from "../booking-state";

export interface PatientDetailsStepProps {
  contact: ContactFormValues;
  errors: ContactFormErrors;
  onFieldChange: (field: keyof ContactFormValues, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

/** Task §41/§42/§43 — bounded to Screen 51's own exact field list (Spec #9 §54): first/last name, phone, optional note. No CIN, no social coverage, no clinical data. */
export function PatientDetailsStep({ contact, errors, onFieldChange, onSubmit, onBack }: PatientDetailsStepProps) {
  const { t } = useLocale();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-primary hover:underline">
        {t("booking.backAction")}
      </button>
      <h2 className="text-lg font-semibold text-text">{t("booking.details.heading")}</h2>

      <Input
        label={t("booking.details.firstNameLabel")}
        required
        value={contact.firstName}
        onChange={(event) => onFieldChange("firstName", event.target.value)}
        error={errors.firstName}
      />
      <Input
        label={t("booking.details.lastNameLabel")}
        required
        value={contact.lastName}
        onChange={(event) => onFieldChange("lastName", event.target.value)}
        error={errors.lastName}
      />
      <Input
        type="tel"
        label={t("booking.details.phoneLabel")}
        required
        value={contact.phone}
        onChange={(event) => onFieldChange("phone", event.target.value)}
        error={errors.phone}
      />
      <Textarea
        label={t("booking.details.noteLabel")}
        value={contact.note}
        onChange={(event) => onFieldChange("note", event.target.value)}
      />

      <Button type="submit">{t("booking.details.continueAction")}</Button>
    </form>
  );
}
