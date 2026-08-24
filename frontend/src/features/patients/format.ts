import type { Locale } from "@/i18n/config";
import { toIntlLocale } from "@/i18n/intl-locale";
import type { Patient, PatientNextAppointment } from "./types";

export { formatMad } from "@/features/today/format";

export function formatShortDate(isoDate: string, locale: Locale): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    calendar: "gregory",
  }).format(date);
}

export function formatNextAppointment(next: PatientNextAppointment, locale: Locale): string {
  return `${formatShortDate(next.date, locale)} · ${next.time}`;
}

/** "27 août" — day + month name, no year (Patient 360°'s date style, Spec #9 Screen 17). */
export function formatDayMonth(isoDate: string, locale: Locale): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "long",
    calendar: "gregory",
  }).format(date);
}

export function formatDayMonthTime(next: PatientNextAppointment, locale: Locale): string {
  return `${formatDayMonth(next.date, locale)} · ${next.time}`;
}

/**
 * Plain integer arithmetic on the ISO string parts — no `Date` object
 * timezone parsing involved, so there is no UTC/local mismatch to guard
 * against (see the `addDaysIso` note in `features/agenda/format.ts`).
 */
export function computeAge(birthDateIso: string, referenceIso: string): number {
  const [birthYear, birthMonth, birthDay] = birthDateIso.split("-").map(Number);
  const [refYear, refMonth, refDay] = referenceIso.split("-").map(Number);

  let age = refYear - birthYear;
  const hasHadBirthdayThisYear = refMonth > birthMonth || (refMonth === birthMonth && refDay >= birthDay);
  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

export function getPatientFullName(patient: Pick<Patient, "firstName" | "lastName">): string {
  return `${patient.firstName} ${patient.lastName}`;
}

export function getPatientInitials(patient: Pick<Patient, "firstName" | "lastName">): string {
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}
