import type { Locale } from "@/i18n/config";

export function toIntlLocale(locale: Locale): string {
  // ar-MA (not generic "ar"): Western digits for times/amounts stay
  // readable in Arabic (UI-001 §25), and the Gregorian calendar matches
  // Moroccan business use without relying on ICU locale defaults.
  return locale === "ar" ? "ar-MA" : "fr-FR";
}

export function formatBusinessDate(isoDate: string, locale: Locale): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const formatted = new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    calendar: "gregory",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** CLAUDE.md §20: MAD only, fixed-precision — this formats already-decimal mock amounts for display. */
export function formatMad(amount: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(amount);

  return `${formatted} MAD`;
}
