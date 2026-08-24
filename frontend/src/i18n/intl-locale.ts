import type { Locale } from "./config";

/**
 * Maps our two supported locales to full ICU locale tags for `Intl.*` APIs.
 * `ar-MA` (not generic "ar"): Western digits for times/amounts stay
 * readable in Arabic, and the Gregorian calendar matches Moroccan business
 * use without relying on ICU locale defaults (UI-001 §25). Shared by every
 * feature that formats dates/money — moved here from `features/today/
 * format.ts` once Agenda and Patients both needed it too (UI-003B).
 */
export function toIntlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-MA" : "fr-FR";
}
