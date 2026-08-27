import { describe, expect, it } from "vitest";
import { getCommunicationMessagesMockData } from "./mock-messages-data";
import { getMessageTemplatesMockData } from "./mock-templates-data";
import { getAutomationRulesMockData } from "./mock-automation-rules-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { computeCommunicationKpis, getFailedMessageRows, getQueuedMessageRows } from "./dashboard";
import { isValidMessageStatusSemantics } from "./communication";
import { buildSentMessage, retryMessage } from "./operations";
import { resolveRuleTemplate } from "./automations";

/**
 * Cross-cutting integrity across all three gates (UI-009ABC §19), mirroring
 * Stock's own `cross-inventory-integrity.test.ts`: proves the dashboard's
 * derived numbers, the Messages workspace's own filtering, and the
 * operational actions (retry/send) all agree with each other and with the
 * shared fixture set — never a second, independently-drifting derivation.
 */

const messages = getCommunicationMessagesMockData();
const templates = getMessageTemplatesMockData();
const rules = getAutomationRulesMockData();
const patients = getPatientsMockData();
const appointments = getAgendaMockAppointments();
const invoices = getInvoicesMockData();
const businessDate = "2026-08-23";

describe("Dashboard KPIs agree with the raw fixture counts", () => {
  it("failedCount matches the number of failed messages", () => {
    const kpis = computeCommunicationKpis(messages, businessDate);
    expect(kpis.failedCount).toBe(messages.filter((m) => m.status === "failed").length);
  });

  it("queuedCount matches the number of queued messages", () => {
    const kpis = computeCommunicationKpis(messages, businessDate);
    expect(kpis.queuedCount).toBe(messages.filter((m) => m.status === "queued").length);
  });

  it("failedCount matches getFailedMessageRows' own row count", () => {
    const kpis = computeCommunicationKpis(messages, businessDate);
    expect(kpis.failedCount).toBe(getFailedMessageRows(messages, patients, appointments, invoices).length);
  });

  it("queuedCount matches getQueuedMessageRows' own row count", () => {
    const kpis = computeCommunicationKpis(messages, businessDate);
    expect(kpis.queuedCount).toBe(getQueuedMessageRows(messages, patients, appointments, invoices).length);
  });
});

describe("Resolved rows never contradict their own message", () => {
  it("every resolved patient's id matches the message's own patientId", () => {
    for (const row of getFailedMessageRows(messages, patients, appointments, invoices).concat(getQueuedMessageRows(messages, patients, appointments, invoices))) {
      if (row.patient) {
        expect(row.patient.id).toBe(row.message.patientId);
      }
    }
  });
});

describe("retryMessage preserves everything except status/failure/scheduling", () => {
  it("changes only status, failureCode, failureReason and scheduledAt", () => {
    const failed = messages.find((m) => m.status === "failed")!;
    const retried = retryMessage(messages, failed.id, businessDate).find((m) => m.id === failed.id)!;

    expect(retried.id).toBe(failed.id);
    expect(retried.patientId).toBe(failed.patientId);
    expect(retried.invoiceId).toBe(failed.invoiceId);
    expect(retried.installmentId).toBe(failed.installmentId);
    expect(retried.channel).toBe(failed.channel);
    expect(retried.purpose).toBe(failed.purpose);
    expect(retried.recipient).toBe(failed.recipient);
    expect(retried.resolvedBody).toBe(failed.resolvedBody);
    expect(retried.createdAt).toBe(failed.createdAt);
  });

  it("produces a message that is itself status-semantically valid", () => {
    const failed = messages.find((m) => m.status === "failed")!;
    const retried = retryMessage(messages, failed.id, businessDate).find((m) => m.id === failed.id)!;
    expect(isValidMessageStatusSemantics(retried)).toBe(true);
  });

  it("a retry-then-recompute round trip shifts exactly one message from failed to queued, with the total unchanged", () => {
    const failed = messages.find((m) => m.status === "failed")!;
    const retriedMessages = retryMessage(messages, failed.id, businessDate);

    const before = computeCommunicationKpis(messages, businessDate);
    const after = computeCommunicationKpis(retriedMessages, businessDate);

    expect(after.failedCount).toBe(before.failedCount - 1);
    expect(after.queuedCount).toBe(before.queuedCount + 1);
    expect(retriedMessages.length).toBe(messages.length);
  });
});

describe("buildSentMessage produces a status-semantically valid, never-delivered message", () => {
  it("is valid per isValidMessageStatusSemantics", () => {
    const patient = patients[0];
    const created = buildSentMessage({ patientId: patient.id, templateId: "", channel: "whatsapp", body: "Bonjour." }, patient, "msg-new", `${businessDate}T09:15:00`, null);
    expect(isValidMessageStatusSemantics(created)).toBe(true);
    expect(created.status).toBe("sent");
  });

  it("a send-then-recompute round trip increases recentVolumeCount by exactly one, with the total increased by one", () => {
    const patient = patients[0];
    const created = buildSentMessage({ patientId: patient.id, templateId: "", channel: "whatsapp", body: "Bonjour." }, patient, "msg-new", `${businessDate}T09:15:00`, null);
    const withNewMessage = [...messages, created];

    const before = computeCommunicationKpis(messages, businessDate);
    const after = computeCommunicationKpis(withNewMessage, businessDate);

    expect(after.recentVolumeCount).toBe(before.recentVolumeCount + 1);
    expect(withNewMessage.length).toBe(messages.length + 1);
  });
});

describe("Automation rules never point at an incoherent template", () => {
  it("every active rule references an active template", () => {
    for (const rule of rules) {
      if (!rule.active) {
        continue;
      }
      const template = resolveRuleTemplate(rule, templates);
      expect(template).not.toBeNull();
      expect(template?.active).toBe(true);
    }
  });
});
