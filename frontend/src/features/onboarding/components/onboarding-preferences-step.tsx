"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AppointmentSchedulingType } from "@/components/domain/appointments/types";
import type { AppointmentSettingsFormValues } from "@/components/domain/settings/types";
import { validateAppointmentSettingsForm } from "@/features/parametres/appointment-settings";

const SCHEDULING_MODE_ORDER: AppointmentSchedulingType[] = ["exact", "window"];

export interface OnboardingPreferencesStepProps {
  values: AppointmentSettingsFormValues;
  onChange: (values: AppointmentSettingsFormValues) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Step 5 — Préférences (task §24) — not covered by any onboarding
 * wireframe/UX spec (grep-confirmed), so deliberately bounded to the two
 * fields that plausibly belong in first-run setup:
 * `defaultSchedulingMode`/`defaultDurationMinutes`. `DocumentSettings`
 * (footer/header text) is excluded — it needs a fully-populated
 * `CabinetProfile` to derive a sensible default and is a cosmetic document
 * concern, not a "reach a useful product state" one (Spec #7 §28). Reuses
 * `validateAppointmentSettingsForm` and the exact
 * `parametres.rendezVous.form.*` keys `AppointmentSettingsPage` itself
 * uses (task §34) — never a second preferences vocabulary.
 */
export function OnboardingPreferencesStep({ values, onChange, onContinue, onBack }: OnboardingPreferencesStepProps) {
  const { t } = useLocale();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateAppointmentSettingsForm(values, { invalidNumber: t("parametres.rendezVous.form.invalidNumberError") });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onContinue();
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text">{t("onboarding.preferences.heading")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("onboarding.preferences.description")}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t("parametres.rendezVous.form.schedulingModeLabel")}
            required
            value={values.defaultSchedulingMode}
            onChange={(event) => onChange({ ...values, defaultSchedulingMode: event.target.value as AppointmentSchedulingType })}
            options={SCHEDULING_MODE_ORDER.map((mode) => ({ value: mode, label: t(`parametres.services.schedulingMode.${mode}`) }))}
          />
          <Input
            label={t("parametres.rendezVous.form.durationLabel")}
            required
            type="number"
            min={1}
            value={values.defaultDurationMinutes}
            onChange={(event) => onChange({ ...values, defaultDurationMinutes: event.target.value })}
            error={errors.defaultDurationMinutes}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            {t("onboarding.nav.back")}
          </Button>
          <Button type="submit">{t("onboarding.nav.continue")}</Button>
        </div>
      </form>
    </Card>
  );
}
