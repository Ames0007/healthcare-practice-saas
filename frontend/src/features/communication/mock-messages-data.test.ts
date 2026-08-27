import { describe, expect, it } from "vitest";
import { getCommunicationMessagesMockData } from "./mock-messages-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { isValidMessageStatusSemantics } from "./communication";
import { COMMUNICATION_CHANNEL_ORDER } from "@/components/domain/communication/channel";
import { COMMUNICATION_PURPOSE_ORDER } from "@/components/domain/communication/purpose";

const messages = getCommunicationMessagesMockData();
const patients = getPatientsMockData();
const appointments = getAgendaMockAppointments();
const invoices = getInvoicesMockData();

describe("getCommunicationMessagesMockData", () => {
  it("has at least one message", () => {
    expect(messages.length).toBeGreaterThan(0);
  });

  it("has unique message ids", () => {
    const ids = messages.map((message) => message.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses valid channel/purpose values", () => {
    for (const message of messages) {
      expect(COMMUNICATION_CHANNEL_ORDER).toContain(message.channel);
      expect(COMMUNICATION_PURPOSE_ORDER).toContain(message.purpose);
    }
  });

  it("resolves every patientId against the existing Patients fixture", () => {
    for (const message of messages) {
      if (message.patientId) {
        expect(patients.some((patient) => patient.id === message.patientId)).toBe(true);
      }
    }
  });

  it("resolves every appointmentId against the existing Agenda fixture, for the same patient", () => {
    for (const message of messages) {
      if (message.appointmentId) {
        const appointment = appointments.find((candidate) => candidate.id === message.appointmentId);
        expect(appointment).toBeDefined();
        expect(appointment?.patientId).toBe(message.patientId);
      }
    }
  });

  it("resolves every invoiceId against the existing Invoices fixture, for the same patient", () => {
    for (const message of messages) {
      if (message.invoiceId) {
        const invoice = invoices.find((candidate) => candidate.id === message.invoiceId);
        expect(invoice).toBeDefined();
        expect(invoice?.patientId).toBe(message.patientId);
      }
    }
  });

  it("resolves every installmentId within its own invoice's installments", () => {
    for (const message of messages) {
      if (message.installmentId) {
        const invoice = invoices.find((candidate) => candidate.id === message.invoiceId);
        expect(invoice?.installments.some((installment) => installment.id === message.installmentId)).toBe(true);
      }
    }
  });

  it("has status-coherent timestamps/failure metadata for every fixture message", () => {
    for (const message of messages) {
      expect(isValidMessageStatusSemantics(message)).toBe(true);
    }
  });

  it("demonstrates every message status at least once", () => {
    const statuses = new Set(messages.map((message) => message.status));
    expect(statuses).toEqual(new Set(["queued", "sent", "delivered", "failed"]));
  });

  it("demonstrates both channels", () => {
    const channels = new Set(messages.map((message) => message.channel));
    expect(channels).toEqual(new Set(["whatsapp", "sms"]));
  });

  it("never carries clinical vocabulary in the resolved body (administrative content only)", () => {
    const clinicalTerms = /diagnostic|allerg|ordonnance|prescription|pathologie/i;
    for (const message of messages) {
      expect(message.resolvedBody).not.toMatch(clinicalTerms);
    }
  });
});
