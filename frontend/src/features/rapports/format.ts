import type { Locale } from "@/i18n/config";
import { toIntlLocale } from "@/i18n/intl-locale";

/** Re-export barrel (mirrors `features/finance/format.ts`'s own pattern) — one canonical money formatter, never a second incompatible copy. */
export { formatMad } from "@/features/today/format";

/** Locale-aware percentage, one decimal max (e.g. "6,2 %" in French) — matches the task's own Overview wireframe formatting exactly. */
export function formatPercent(value: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);

  return `${formatted} %`;
}

/** Locale-aware duration in hours, one decimal max (e.g. "640 h") — matches the task's own Overview wireframe formatting exactly. */
export function formatHours(value: number, locale: Locale): string {
  const formatted = new Intl.NumberFormat(toIntlLocale(locale), {
    maximumFractionDigits: 1,
  }).format(value);

  return `${formatted} h`;
}
