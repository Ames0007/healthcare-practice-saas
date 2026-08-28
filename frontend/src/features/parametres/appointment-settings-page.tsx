"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import type { AppointmentSchedulingType } from "@/components/domain/appointments/types";
import type { AppointmentSettings, AppointmentSettingsFormValues } from "@/components/domain/settings/types";
import { getAppointmentSettingsMockData } from "./mock-appointment-settings-data";
import {
  applyAppointmentSettingsUpdate,
  buildInitialAppointmentSettingsFormValues,
  validateAppointmentSettingsForm,
} from "./appointment-settings";
import { ParametresNav } from "./components/parametres-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";

export type AppointmentSettingsPageState = "loading" | "loaded" | "error";

export interface AppointmentSettingsPageProps {
  settings?: AppointmentSettings;
  state?: AppointmentSettingsPageState;
  onRetry?: () => void;
}

const SCHEDULING_MODE_ORDER: AppointmentSchedulingType[] = ["exact", "window"];

/**
 * Rendez-vous (UI-010BC Gate 2), `/app/parametres/rendez-vous` — a single-
 * record view/edit toggle (mirrors `CabinetSettingsPage`), bounded to the
 * two fields Spec #2 §46 actually names for this concern: appointment
 * durations/defaults and exact-time/window mode. See
 * `AppointmentSettings`'s own doc comment for what is deliberately absent.
 */
export function AppointmentSettingsPage({ settings: providedSettings, state = "loaded", onRetry }: AppointmentSettingsPageProps) {
  const { t } = useLocale();
  const [settings, setSettings] = useState<AppointmentSettings>(() => providedSettings ?? getAppointmentSettingsMockData());
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<AppointmentSettingsFormValues>(() => buildInitialAppointmentSettingsFormValues(settings));
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
    setValues(buildInitialAppointmentSettingsFormValues(settings));
    setErrors({});
    setEditing(true);
  }

  function cancelEditing() {
    setErrors({});
    setEditing(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateAppointmentSettingsForm(values, {
      invalidNumber: t("parametres.rendezVous.form.invalidNumberError"),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSettings((current) => applyAppointmentSettingsUpdate(current, values));
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("parametres.rendezVous.pageTitle")}
        description={t("parametres.rendezVous.pageDescription")}
        primaryAction={
          !editing ? (
            <Button size="sm" onClick={startEditing}>
              {t("parametres.rendezVous.editAction")}
            </Button>
          ) : undefined
        }
      />

      <ParametresNav />

      <Card>
        {!editing ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.rendezVous.form.schedulingModeLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{t(`parametres.services.schedulingMode.${settings.defaultSchedulingMode}`)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.rendezVous.form.durationLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{t("parametres.services.durationValue", { minutes: settings.defaultDurationMinutes })}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label={t("parametres.rendezVous.form.schedulingModeLabel")}
                required
                value={values.defaultSchedulingMode}
                onChange={(event) =>
                  setValues((current) => ({ ...current, defaultSchedulingMode: event.target.value as AppointmentSchedulingType }))
                }
                options={SCHEDULING_MODE_ORDER.map((option) => ({ value: option, label: t(`parametres.services.schedulingMode.${option}`) }))}
              />
              <Input
                label={t("parametres.rendezVous.form.durationLabel")}
                required
                value={values.defaultDurationMinutes}
                onChange={(event) => setValues((current) => ({ ...current, defaultDurationMinutes: event.target.value }))}
                error={errors.defaultDurationMinutes}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={cancelEditing}>
                {t("parametres.rendezVous.form.cancel")}
              </Button>
              <Button type="submit">{t("parametres.rendezVous.form.save")}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
