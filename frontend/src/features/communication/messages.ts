import type { CommunicationMessage } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { Invoice } from "@/components/domain/finance/types";
import { getPatientFullName } from "@/features/patients/format";
import { normalizePhoneDigits } from "@/features/patients/normalize";

export interface MessageRow {
  message: CommunicationMessage;
  patient: Patient | null;
  appointment: AgendaAppointment | null;
  invoice: Invoice | null;
}

/**
 * Resolves each message's soft references against the existing
 * Patients/Agenda/Invoices fixtures (UI-009ABC §5) — never a live join
 * against a store, mirrors `buildItemRows`'s own resolve-at-render-time
 * pattern. A dangling reference resolves to `null` rather than throwing,
 * since a prototype fixture's own referential-integrity is proven
 * separately by `mock-messages-data.test.ts`.
 */
export function buildMessageRows(messages: CommunicationMessage[], patients: Patient[], appointments: AgendaAppointment[], invoices: Invoice[]): MessageRow[] {
  return messages.map((message) => ({
    message,
    patient: message.patientId ? (patients.find((patient) => patient.id === message.patientId) ?? null) : null,
    appointment: message.appointmentId ? (appointments.find((appointment) => appointment.id === message.appointmentId) ?? null) : null,
    invoice: message.invoiceId ? (invoices.find((invoice) => invoice.id === message.invoiceId) ?? null) : null,
  }));
}

/**
 * Patient name, patient number or recipient phone (UI-009ABC §16) —
 * case-insensitive; phone comparison reuses the existing digits-only
 * normalizer so "06 12 34 56 78" and "0612345678" match identically.
 */
export function matchesMessageSearch(row: MessageRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (query === "") {
    return true;
  }

  const patientName = row.patient ? getPatientFullName(row.patient).toLowerCase() : "";
  const patientNumber = row.patient?.patientNumber.toLowerCase() ?? "";
  if (patientName.includes(query) || patientNumber.includes(query)) {
    return true;
  }

  const normalizedQuery = normalizePhoneDigits(query);
  return normalizedQuery !== "" && normalizePhoneDigits(row.message.recipient).includes(normalizedQuery);
}
