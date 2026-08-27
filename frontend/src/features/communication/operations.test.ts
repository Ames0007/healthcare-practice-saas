import { describe, expect, it } from "vitest";
import type { CommunicationMessage, MessageTemplate } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import {
  applyTemplateToSendMessageForm,
  buildInitialSendMessageFormValues,
  buildSentMessage,
  resolveSendMessageContext,
  retryMessage,
} from "./operations";

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

function buildMessage(overrides: Partial<CommunicationMessage> = {}): CommunicationMessage {
  return {
    id: "msg-1",
    patientId: "pat-9",
    channel: "sms",
    purpose: "overdue_payment_reminder",
    recipient: "06 90 12 34 56",
    resolvedBody: "Test",
    status: "failed",
    failureCode: "INVALID_NUMBER",
    failureReason: "Numéro invalide.",
    createdAt: "2026-08-22T08:00:00",
    ...overrides,
  };
}

describe("retryMessage", () => {
  it("re-queues a failed message and clears its failure metadata", () => {
    const [retried] = retryMessage([buildMessage()], "msg-1", "2026-08-23");
    expect(retried.status).toBe("queued");
    expect(retried.failureCode).toBeUndefined();
    expect(retried.failureReason).toBeUndefined();
    expect(retried.scheduledAt).toBe("2026-08-23");
  });

  it("never fabricates a successful sent/delivered outcome", () => {
    const [retried] = retryMessage([buildMessage()], "msg-1", "2026-08-23");
    expect(retried.status).not.toBe("sent");
    expect(retried.status).not.toBe("delivered");
  });

  it("leaves a non-matching or non-failed message untouched", () => {
    const queued = buildMessage({ id: "msg-2", status: "queued", failureCode: undefined, failureReason: undefined });
    const [unchanged] = retryMessage([queued], "msg-2", "2026-08-23");
    expect(unchanged).toEqual(queued);
  });

  it("does not mutate the input array", () => {
    const messages = [buildMessage()];
    const original = [...messages];
    retryMessage(messages, "msg-1", "2026-08-23");
    expect(messages).toEqual(original);
  });
});

describe("resolveSendMessageContext", () => {
  it("resolves real patient identity fields", () => {
    expect(resolveSendMessageContext(patient, "Cabinet (exemple)")).toEqual({
      patient_first_name: "Ahmed",
      patient_name: "Ahmed El Mansouri",
      practitioner_name: "Dr. Benali",
      cabinet_name: "Cabinet (exemple)",
    });
  });

  it("still resolves cabinet_name with no patient selected", () => {
    expect(resolveSendMessageContext(null, "Cabinet (exemple)")).toEqual({ cabinet_name: "Cabinet (exemple)" });
  });
});

describe("applyTemplateToSendMessageForm", () => {
  const template: MessageTemplate = {
    id: "tpl-1",
    name: "Rappel",
    purpose: "appointment_reminder",
    channel: "whatsapp",
    locale: "fr",
    body: "Bonjour {{patient_first_name}}, rappel.",
    variables: ["patient_first_name"],
    active: true,
  };

  it("fills channel and renders the body against the selected patient", () => {
    const applied = applyTemplateToSendMessageForm(buildInitialSendMessageFormValues(), template, patient, "Cabinet (exemple)");
    expect(applied.channel).toBe("whatsapp");
    expect(applied.templateId).toBe("tpl-1");
    expect(applied.body).toBe("Bonjour Ahmed, rappel.");
  });

  it("renders the deterministic missing-value placeholder when no patient is selected yet", () => {
    const applied = applyTemplateToSendMessageForm(buildInitialSendMessageFormValues(), template, null, "Cabinet (exemple)");
    expect(applied.body).toBe("Bonjour —, rappel.");
  });
});

describe("buildSentMessage", () => {
  it("records a synchronous local 'sent' message, never 'delivered'", () => {
    const values = { patientId: "pat-1", templateId: "", channel: "whatsapp" as const, body: "Bonjour Ahmed." };
    const created = buildSentMessage(values, patient, "msg-99", "2026-08-23T09:15:00", null);
    expect(created.status).toBe("sent");
    expect(created.sentAt).toBe("2026-08-23T09:15:00");
    expect(created.recipient).toBe(patient.phone);
    expect(created.purpose).toBe("custom_operational");
  });

  it("takes the purpose from the selected template when there is one", () => {
    const template: MessageTemplate = {
      id: "tpl-1",
      name: "Rappel",
      purpose: "appointment_reminder",
      channel: "whatsapp",
      locale: "fr",
      body: "x",
      variables: [],
      active: true,
    };
    const values = { patientId: "pat-1", templateId: "tpl-1", channel: "whatsapp" as const, body: "Bonjour Ahmed." };
    const created = buildSentMessage(values, patient, "msg-99", "2026-08-23T09:15:00", template);
    expect(created.purpose).toBe("appointment_reminder");
    expect(created.templateId).toBe("tpl-1");
  });
});
