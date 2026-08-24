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

export function getPatientFullName(patient: Pick<Patient, "firstName" | "lastName">): string {
  return `${patient.firstName} ${patient.lastName}`;
}

export function getPatientInitials(patient: Pick<Patient, "firstName" | "lastName">): string {
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}
