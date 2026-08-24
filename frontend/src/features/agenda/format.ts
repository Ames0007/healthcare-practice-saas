import type { Locale } from "@/i18n/config";
import { formatBusinessDate } from "@/features/today/format";

function toIntlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-MA" : "fr-FR";
}

/**
 * Entirely UTC-based (construction, arithmetic and serialization) so the
 * result never depends on the runtime's local timezone offset — mixing
 * local-time parsing with `toISOString()` would silently shift the date
 * by a day for any non-UTC timezone ahead of UTC.
 */
export function addDaysIso(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `iso`. */
export function getWeekStart(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDaysIso(iso, diffToMonday);
}

export function getWeekDates(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysIso(weekStartIso, index));
}

export { formatBusinessDate };

export function formatWeekdayShort(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(toIntlLocale(locale), { weekday: "short", calendar: "gregory" }).format(date);
}

export function formatDayNumber(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat(toIntlLocale(locale), { day: "numeric", calendar: "gregory" }).format(date);
}

export function formatWeekRangeLabel(weekStartIso: string, locale: Locale): string {
  const weekEndIso = addDaysIso(weekStartIso, 6);
  const start = new Date(`${weekStartIso}T00:00:00`);
  const end = new Date(`${weekEndIso}T00:00:00`);
  const intlLocale = toIntlLocale(locale);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const startLabel = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: sameMonth ? undefined : "long",
    calendar: "gregory",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: "gregory",
  }).format(end);

  return `${startLabel} – ${endLabel}`;
}

/** 30-minute-aligned time slots between two hours, e.g. 08:00..18:00. */
export function generateTimeSlots(startHour: number, endHour: number, stepMinutes: number): string[] {
  const slots: string[] = [];
  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += stepMinutes) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/**
 * The slot (from a `generateTimeSlots`-style grid) that contains `time` —
 * floors to the nearest `stepMinutes` boundary. An appointment does not
 * need to start exactly on a slot boundary to be placed correctly (e.g.
 * a 08:55 arrival still belongs in the 08:30 slot).
 */
export function getContainingSlot(time: string, stepMinutes: number): string {
  const flooredMinutes = Math.floor(parseTimeToMinutes(time) / stepMinutes) * stepMinutes;
  const hh = String(Math.floor(flooredMinutes / 60)).padStart(2, "0");
  const mm = String(flooredMinutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function parseTimeToMinutes(time: string): number {
  const [hh, mm] = time.split(":").map(Number);
  return hh * 60 + mm;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const total = parseTimeToMinutes(time) + minutes;
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Fixed-`now` waiting duration in minutes (§39 — no ticking timers). */
export function computeWaitingMinutes(arrivedAt: string, nowTime: string): number {
  return Math.max(0, parseTimeToMinutes(nowTime) - parseTimeToMinutes(arrivedAt));
}
