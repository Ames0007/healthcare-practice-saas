import type { CabinetProfile, DocumentSettings, DocumentSettingsFormValues } from "@/components/domain/settings/types";

/**
 * Derives the default document footer from the Cabinet profile itself
 * (name, phone, and address if set) rather than an independently
 * hardcoded string — the same "derive, never duplicate" discipline
 * `features/rapports` applies to KPIs, applied here to a configuration
 * default. Editing this footer afterward does not write back to
 * `CabinetProfile` (no cross-page state bus exists, see
 * `CabinetSettingsPage`'s own doc comment) — this only seeds the initial
 * value honestly instead of inventing an unrelated example string.
 */
export function buildDefaultDocumentFooter(profile: CabinetProfile): string {
  const parts = [profile.name, profile.phone, profile.address].filter((part): part is string => Boolean(part && part.trim()));
  return parts.join(" — ");
}

/** Initial edit-form state from the current settings (UI-010BC §15). */
export function buildInitialDocumentSettingsFormValues(settings: DocumentSettings): DocumentSettingsFormValues {
  return {
    footerText: settings.footerText,
    headerNote: settings.headerNote ?? "",
    documentLanguage: settings.documentLanguage,
  };
}

/** Footer text is required — it is what identifies the cabinet on every generated document; header note stays optional. */
export function validateDocumentSettingsForm(
  values: DocumentSettingsFormValues,
  messages: { required: string },
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.footerText.trim()) errors.footerText = messages.required;

  return errors;
}

/** Applies a validated form submission to the current settings. */
export function applyDocumentSettingsUpdate(settings: DocumentSettings, values: DocumentSettingsFormValues): DocumentSettings {
  return {
    footerText: values.footerText.trim(),
    headerNote: values.headerNote.trim() || undefined,
    documentLanguage: values.documentLanguage,
  };
}
