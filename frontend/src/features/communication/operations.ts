import type { CommunicationChannel, CommunicationMessage, MessageTemplate } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import { getPatientFullName } from "@/features/patients/format";
import { renderTemplate, type TemplateRenderContext } from "./templates";

/**
 * Re-queues a failed message for another send attempt (UI-009ABC §16).
 * Moves to "queued" rather than fabricating a successful "sent"/"delivered"
 * outcome — retrying does not itself confirm delivery, and this is
 * prototype metadata only (§12: "Do not claim real delivery"). Failure
 * metadata is cleared since it no longer describes the message's current
 * (re-queued) state.
 */
export function retryMessage(messages: CommunicationMessage[], messageId: string, retryDate: string): CommunicationMessage[] {
  return messages.map((message) => {
    if (message.id !== messageId || message.status !== "failed") {
      return message;
    }
    return { ...message, status: "queued", failureCode: undefined, failureReason: undefined, scheduledAt: retryDate };
  });
}

export interface SendMessageFormValues {
  patientId: string;
  /** "" = no template — a free-typed operational message. */
  templateId: string;
  channel: CommunicationChannel;
  body: string;
}

export function buildInitialSendMessageFormValues(): SendMessageFormValues {
  return { patientId: "", templateId: "", channel: "whatsapp", body: "" };
}

/**
 * Real, resolvable variables only (patient identity + practitioner +
 * cabinet name) — this bounded compose flow has no appointment/invoice
 * picker, so those tokens deliberately render as the renderer's own
 * "missing value" placeholder rather than a fabricated one (§28).
 */
export function resolveSendMessageContext(patient: Patient | null, cabinetName: string): TemplateRenderContext {
  if (!patient) {
    return { cabinet_name: cabinetName };
  }
  return {
    patient_first_name: patient.firstName,
    patient_name: getPatientFullName(patient),
    practitioner_name: patient.responsiblePractitionerName,
    cabinet_name: cabinetName,
  };
}

/** Applies a selected template's channel/body (rendered against the current patient) to the compose form — the user may still edit the result before sending. */
export function applyTemplateToSendMessageForm(values: SendMessageFormValues, template: MessageTemplate, patient: Patient | null, cabinetName: string): SendMessageFormValues {
  return {
    ...values,
    templateId: template.id,
    channel: template.channel,
    body: renderTemplate(template.body, resolveSendMessageContext(patient, cabinetName)),
  };
}

/**
 * A manually composed message is recorded as "sent" immediately (a
 * synchronous local record of having handed it off) — never "delivered",
 * since no real provider acknowledgment exists in this prototype (§12).
 * `purpose` comes from the selected template when there is one, since
 * that is the message's real category — "custom_operational" is only the
 * fallback for a free-typed, template-less send.
 */
export function buildSentMessage(values: SendMessageFormValues, patient: Patient, generatedId: string, sentAt: string, template: MessageTemplate | null): CommunicationMessage {
  return {
    id: generatedId,
    patientId: patient.id,
    channel: values.channel,
    purpose: template?.purpose ?? "custom_operational",
    templateId: values.templateId || undefined,
    recipient: patient.phone,
    resolvedBody: values.body,
    status: "sent",
    createdAt: sentAt,
    sentAt,
  };
}

export function generateNextMessageId(messages: CommunicationMessage[]): string {
  return `msg-${messages.length + 1}`;
}
