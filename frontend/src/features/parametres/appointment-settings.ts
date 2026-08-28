import type { AppointmentSettings, AppointmentSettingsFormValues } from "@/components/domain/settings/types";

/** Initial edit-form state from the current settings (UI-010BC §12). */
export function buildInitialAppointmentSettingsFormValues(settings: AppointmentSettings): AppointmentSettingsFormValues {
  return {
    defaultSchedulingMode: settings.defaultSchedulingMode,
    defaultDurationMinutes: String(settings.defaultDurationMinutes),
  };
}

/** Duration must be a positive whole number of minutes (mirrors `validateServiceForm`'s own numeric-field validation shape). */
export function validateAppointmentSettingsForm(
  values: AppointmentSettingsFormValues,
  messages: { invalidNumber: string },
): Record<string, string> {
  const errors: Record<string, string> = {};

  const duration = Number(values.defaultDurationMinutes);
  if (!values.defaultDurationMinutes.trim() || !Number.isFinite(duration) || duration <= 0) {
    errors.defaultDurationMinutes = messages.invalidNumber;
  }

  return errors;
}

/** Applies a validated form submission to the current settings. */
export function applyAppointmentSettingsUpdate(
  settings: AppointmentSettings,
  values: AppointmentSettingsFormValues,
): AppointmentSettings {
  return {
    defaultSchedulingMode: values.defaultSchedulingMode,
    defaultDurationMinutes: Number(values.defaultDurationMinutes),
  };
}
