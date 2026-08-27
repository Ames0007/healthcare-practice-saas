"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import type { CabinetProfile, CabinetProfileFormValues, PreferredLanguage } from "@/components/domain/settings/types";
import { CABINET_SPECIALTY_MAP, CABINET_SPECIALTY_ORDER } from "@/components/domain/settings/specialty";
import { getCabinetProfileMockData } from "./mock-cabinet-profile-data";
import { applyCabinetSettingsUpdate, buildInitialCabinetSettingsFormValues, validateCabinetSettingsForm } from "./cabinet-settings";
import { ParametresNav } from "./components/parametres-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";

export type CabinetSettingsPageState = "loading" | "loaded" | "error";

export interface CabinetSettingsPageProps {
  profile?: CabinetProfile;
  state?: CabinetSettingsPageState;
  onRetry?: () => void;
}

const LANGUAGE_ORDER: PreferredLanguage[] = ["fr", "ar"];

/**
 * Cabinet Settings (UI-010ABC Gate 2), `/app/parametres` — replaces the
 * generic Paramètres placeholder. A single-record view/edit toggle (not a
 * list+dialog pattern, since there is exactly one cabinet profile) —
 * mirrors the onboarding wireframe's own field set (Spec #9 Screen 04).
 *
 * Edits are local component state only, reset on navigation/reload — this
 * prototype has no global store and no persistence (task's own explicit
 * constraint). Notably, saving here does NOT update `topbar.practiceName`
 * elsewhere in the app: no cross-component state bus exists, matching the
 * same local-state-only boundary every prior UI-00X task's own edit flows
 * already have (e.g. editing a Communication template never changed
 * anything outside that module). This is a deliberate scope boundary, not
 * an oversight.
 */
export function CabinetSettingsPage({ profile: providedProfile, state = "loaded", onRetry }: CabinetSettingsPageProps) {
  const { t } = useLocale();
  const [profile, setProfile] = useState<CabinetProfile>(() => providedProfile ?? getCabinetProfileMockData());
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<CabinetProfileFormValues>(() => buildInitialCabinetSettingsFormValues(profile));
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (state === "loading") {
    return <SettingsSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("parametres.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("parametres.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  function startEditing() {
    setValues(buildInitialCabinetSettingsFormValues(profile));
    setErrors({});
    setEditing(true);
  }

  function cancelEditing() {
    setErrors({});
    setEditing(false);
  }

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
    setProfile((current) => applyCabinetSettingsUpdate(current, values));
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("parametres.pageTitle")}
        description={t("parametres.pageDescription")}
        primaryAction={
          !editing ? (
            <Button size="sm" onClick={startEditing}>
              {t("parametres.cabinet.editAction")}
            </Button>
          ) : undefined
        }
      />

      <ParametresNav />

      <Card>
        <h2 className="text-lg font-semibold text-text">{t("parametres.cabinet.sectionTitle")}</h2>

        {!editing ? (
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.form.nameLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.form.specialtyLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{t(CABINET_SPECIALTY_MAP[profile.specialty].translationKey)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.form.phoneLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{profile.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.form.emailLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{profile.email || t("parametres.cabinet.notSet")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.form.addressLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{profile.address || t("parametres.cabinet.notSet")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.form.cityLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{profile.city || t("parametres.cabinet.notSet")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.form.languageLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{t(`parametres.cabinet.language.${profile.preferredLanguage}`)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.currencyLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{profile.currencyCode}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.timezoneLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{profile.timezone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.cabinet.logoLabel")}</dt>
              <dd className="mt-1 text-sm text-text-muted">{t("parametres.cabinet.logoPlaceholder")}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t("parametres.cabinet.form.nameLabel")}
                required
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                error={errors.name}
              />
              <Select
                label={t("parametres.cabinet.form.specialtyLabel")}
                required
                value={values.specialty}
                onChange={(event) =>
                  setValues((current) => ({ ...current, specialty: event.target.value as CabinetProfileFormValues["specialty"] }))
                }
                options={CABINET_SPECIALTY_ORDER.map((option) => ({ value: option, label: t(CABINET_SPECIALTY_MAP[option].translationKey) }))}
              />
              <Input
                label={t("parametres.cabinet.form.phoneLabel")}
                required
                value={values.phone}
                onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
                error={errors.phone}
              />
              <Input
                type="email"
                label={t("parametres.cabinet.form.emailLabel")}
                value={values.email}
                onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                error={errors.email}
              />
              <Input
                label={t("parametres.cabinet.form.addressLabel")}
                value={values.address}
                onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))}
              />
              <Input
                label={t("parametres.cabinet.form.cityLabel")}
                value={values.city}
                onChange={(event) => setValues((current) => ({ ...current, city: event.target.value }))}
              />
              <Select
                label={t("parametres.cabinet.form.languageLabel")}
                required
                value={values.preferredLanguage}
                onChange={(event) =>
                  setValues((current) => ({ ...current, preferredLanguage: event.target.value as PreferredLanguage }))
                }
                options={LANGUAGE_ORDER.map((option) => ({ value: option, label: t(`parametres.cabinet.language.${option}`) }))}
              />
            </div>

            <p className="text-xs text-text-muted">{t("parametres.cabinet.form.fixedFieldsNote")}</p>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={cancelEditing}>
                {t("parametres.cabinet.form.cancel")}
              </Button>
              <Button type="submit">{t("parametres.cabinet.form.save")}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
