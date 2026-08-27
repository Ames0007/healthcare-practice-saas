import { describe, expect, it } from "vitest";
import type { CommunicationMessage } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { Invoice } from "@/components/domain/finance/types";
import { buildMessageRows, matchesMessageSearch } from "./messages";

const patient: Patient = {
  id: "pat-1",
  patientNumber: "PAT-00281",
  firstName: "Ahmed",
  lastName: "El Mansouri",
  phone: "06 12 34 56 78",
  responsiblePractitionerId: "pr-1",
  responsiblePractitionerName: "Dr. Benali",
  lastVisit: "2026-08-18",
  nextAppointment: null,
  outstandingBalance: 0,
};

const appointment: AgendaAppointment = {
  id: "apt-6",
  date: "2026-08-23",
  schedulingType: "exact",
  time: "10:30",
  durationMinutes: 30,
  patientId: "pat-1",
  patientName: "Ahmed El Mansouri",
  practitionerId: "pr-1",
  practitionerName: "Dr. Benali",
  service: "Consultation",
  status: "confirmed",
};

const invoice: Invoice = {
  id: "inv-1",
  patientId: "pat-1",
  invoiceNumber: "FAC-2026-00142",
  issuedDate: "2026-08-01",
  status: "partially_paid",
  currency: "MAD",
  description: "Traitement",
  practitionerName: "Dr. Benali",
  totalAmount: 3000,
  paidAmount: 1500,
  remainingAmount: 1500,
  lines: [],
  installments: [],
};

function buildMessage(overrides: Partial<CommunicationMessage> = {}): CommunicationMessage {
  return {
    id: "msg-1",
    patientId: "pat-1",
    appointmentId: "apt-6",
    invoiceId: "inv-1",
    channel: "whatsapp",
    purpose: "appointment_reminder",
    recipient: "06 12 34 56 78",
    resolvedBody: "Test",
    status: "queued",
    createdAt: "2026-08-23T08:00:00",
    ...overrides,
  };
}

describe("buildMessageRows", () => {
  it("resolves patient/appointment/invoice references", () => {
    const [row] = buildMessageRows([buildMessage()], [patient], [appointment], [invoice]);
    expect(row.patient).toEqual(patient);
    expect(row.appointment).toEqual(appointment);
    expect(row.invoice).toEqual(invoice);
  });

  it("resolves to null when a reference is absent", () => {
    const [row] = buildMessageRows([buildMessage({ patientId: undefined, appointmentId: undefined, invoiceId: undefined })], [patient], [appointment], [invoice]);
    expect(row.patient).toBeNull();
    expect(row.appointment).toBeNull();
    expect(row.invoice).toBeNull();
  });

  it("resolves to null for a dangling reference instead of throwing", () => {
    const [row] = buildMessageRows([buildMessage({ patientId: "pat-does-not-exist" })], [patient], [appointment], [invoice]);
    expect(row.patient).toBeNull();
  });
});

describe("matchesMessageSearch", () => {
  const [row] = buildMessageRows([buildMessage()], [patient], [appointment], [invoice]);

  it("matches on patient full name, case-insensitively", () => {
    expect(matchesMessageSearch(row, "ahmed")).toBe(true);
    expect(matchesMessageSearch(row, "MANSOURI")).toBe(true);
  });

  it("matches on patient number", () => {
    expect(matchesMessageSearch(row, "PAT-00281")).toBe(true);
  });

  it("matches on recipient phone regardless of spacing", () => {
    expect(matchesMessageSearch(row, "0612345678")).toBe(true);
  });

  it("returns true for an empty/blank query", () => {
    expect(matchesMessageSearch(row, "")).toBe(true);
    expect(matchesMessageSearch(row, "   ")).toBe(true);
  });

  it("returns false for a non-matching query", () => {
    expect(matchesMessageSearch(row, "Zohra")).toBe(false);
  });

  it("falls back to the recipient phone when there is no resolved patient", () => {
    const [rowWithoutPatient] = buildMessageRows([buildMessage({ patientId: undefined })], [patient], [appointment], [invoice]);
    expect(matchesMessageSearch(rowWithoutPatient, "0612345678")).toBe(true);
  });
});
