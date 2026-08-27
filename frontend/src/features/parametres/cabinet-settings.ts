import type { CabinetProfile, CabinetProfileFormValues } from "@/components/domain/settings/types";
import { isValidEmail, isValidMoroccanPhone } from "@/features/patients/patient-form-validation";

/** Initial edit-form state from the current profile (UI-010ABC §12) — `currencyCode`/`timezone` are excluded, never editable. */
export function buildInitialCabinetSettingsFormValues(profile: CabinetProfile): CabinetProfileFormValues {
  return {
    name: profile.name,
    specialty: profile.specialty,
    address: profile.address ?? "",
    city: profile.city ?? "",
    phone: profile.phone,
    email: profile.email ?? "",
    preferredLanguage: profile.preferredLanguage,
  };
}

/**
 * Name and phone are required (Spec #4 §5.1's `tenants.name`/`phone` are
 * both non-null columns); address/city/email stay optional, mirroring the
 * schema's own nullable columns. Reuses the existing `isValidEmail`/
 * `isValidMoroccanPhone` validators (UI-003B) — never a second, possibly
 * inconsistent phone/email pattern.
 */
export function validateCabinetSettingsForm(
  values: CabinetProfileFormValues,
  messages: { required: string; invalidPhone: string; invalidEmail: string },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) errors.name = messages.required;
  if (!values.phone.trim()) {
    errors.phone = messages.required;
  } else if (!isValidMoroccanPhone(values.phone)) {
    errors.phone = messages.invalidPhone;
  }
  if (values.email.trim() && !isValidEmail(values.email)) {
    errors.email = messages.invalidEmail;
  }

  return errors;
}

/** Applies a validated form submission to the current profile — `currencyCode`/`timezone` are always carried over unchanged, never overwritten by form input. */
export function applyCabinetSettingsUpdate(profile: CabinetProfile, values: CabinetProfileFormValues): CabinetProfile {
  return {
    ...profile,
    name: values.name.trim(),
    specialty: values.specialty,
    address: values.address.trim() || undefined,
    city: values.city.trim() || undefined,
    phone: values.phone.trim(),
    email: values.email.trim() || undefined,
    preferredLanguage: values.preferredLanguage,
  };
}
