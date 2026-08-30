"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { CabinetProfileFormValues, PreferredLanguage } from "@/components/domain/settings/types";
import { CABINET_SPECIALTY_MAP, CABINET_SPECIALTY_ORDER } from "@/components/domain/settings/specialty";
import { validateCabinetSettingsForm } from "@/features/parametres/cabinet-settings";

const LANGUAGE_ORDER: PreferredLanguage[] = ["fr", "ar"];

export interface OnboardingCabinetStepProps {
  values: CabinetProfileFormValues;
  onChange: (values: CabinetProfileFormValues) => void;
  onContinue: () => void;
}

/**
 * Step 1 — Cabinet (task §17, folding Spec #9 Screen 03's separate
 * "Spécialité" screen into this one field list, per this task's own
 * explicit §17 instruction — see ADR-019). Reuses
 * `validateCabinetSettingsForm`/`CABINET_SPECIALTY_MAP`/
 * `CABINET_SPECIALTY_ORDER` and the exact `parametres.cabinet.form.*`
 * translation keys `CabinetSettingsPage` itself already uses — never a
 * second Cabinet vocabulary (task §30, proven by
 * `cross-onboarding-integrity.test.ts`). `currencyCode`/`timezone` are
 * shown read-only with the Morocco defaults (task §17) — never editable,
 * matching `CabinetProfileFormValues`'s own exclusion of both fields.
 */
export function OnboardingCabinetStep({ values, onChange, onContinue }: OnboardingCabinetStepProps) {
  const { t } = useLocale();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateCabinetSettingsForm(values, {
      required: t("parametres.cabinet.form.requiredError"),
      invalidPhone: t("parametres.cabinet.form.invalidPhoneError"),
      invalidEmail: t("parametres.cabinet.form.invalidEmailError"),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onContinue();
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-text">{t("onboarding.cabinet.heading")}</h2>
      <p className="mt-1 text-sm text-text-secondary">{t("onboarding.cabinet.description")}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("parametres.cabinet.form.nameLabel")}
            required
            value={values.name}
            onChange={(event) => onChange({ ...values, name: event.target.value })}
            error={errors.name}
          />
          <Select
            label={t("parametres.cabinet.form.specialtyLabel")}
            required
            value={values.specialty}
            onChange={(event) => onChange({ ...values, specialty: event.target.value as CabinetProfileFormValues["specialty"] })}
            options={CABINET_SPECIALTY_ORDER.map((option) => ({ value: option, label: t(CABINET_SPECIALTY_MAP[option].translationKey) }))}
          />
          <Input
            label={t("parametres.cabinet.form.phoneLabel")}
            required
            value={values.phone}
            onChange={(event) => onChange({ ...values, phone: event.target.value })}
            error={errors.phone}
          />
          <Input
            type="email"
            label={t("parametres.cabinet.form.emailLabel")}
            value={values.email}
            onChange={(event) => onChange({ ...values, email: event.target.value })}
            error={errors.email}
          />
          <Input
            label={t("parametres.cabinet.form.addressLabel")}
            value={values.address}
            onChange={(event) => onChange({ ...values, address: event.target.value })}
          />
          <Input
            label={t("parametres.cabinet.form.cityLabel")}
            value={values.city}
            onChange={(event) => onChange({ ...values, city: event.target.value })}
          />
          <Select
            label={t("parametres.cabinet.form.languageLabel")}
            required
            value={values.preferredLanguage}
            onChange={(event) => onChange({ ...values, preferredLanguage: event.target.value as PreferredLanguage })}
            options={LANGUAGE_ORDER.map((option) => ({ value: option, label: t(`parametres.cabinet.language.${option}`) }))}
          />
        </div>

        <dl className="grid grid-cols-1 gap-4 rounded-md border border-border bg-surface-subtle p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-text-muted">{t("parametres.cabinet.currencyLabel")}</dt>
            <dd className="text-sm text-text">MAD</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-text-muted">{t("parametres.cabinet.timezoneLabel")}</dt>
            <dd className="text-sm text-text">Africa/Casablanca</dd>
          </div>
        </dl>
        <p className="text-xs text-text-muted">{t("parametres.cabinet.form.fixedFieldsNote")}</p>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="submit">{t("onboarding.nav.continue")}</Button>
        </div>
      </form>
    </Card>
  );
}
