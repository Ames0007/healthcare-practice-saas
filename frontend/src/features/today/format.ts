import type { Locale } from "@/i18n/config";
import { toIntlLocale } from "@/i18n/intl-locale";

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
