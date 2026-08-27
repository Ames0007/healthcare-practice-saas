import type { CommunicationEventType } from "./types";

interface CommunicationEventTypeMeta {
  translationKey: string;
}

/** Central automation event-type → label registry (UI-009ABC §10, Spec #2 §40). */
export const COMMUNICATION_EVENT_TYPE_MAP: Record<CommunicationEventType, CommunicationEventTypeMeta> = {
  appointment_confirmed: { translationKey: "communication.eventType.appointment_confirmed" },
  appointment_reminder: { translationKey: "communication.eventType.appointment_reminder" },
  appointment_modified: { translationKey: "communication.eventType.appointment_modified" },
  appointment_cancelled: { translationKey: "communication.eventType.appointment_cancelled" },
  payment_recorded: { translationKey: "communication.eventType.payment_recorded" },
  installment_due: { translationKey: "communication.eventType.installment_due" },
  installment_overdue: { translationKey: "communication.eventType.installment_overdue" },
};

export const COMMUNICATION_EVENT_TYPE_ORDER: CommunicationEventType[] = [
  "appointment_confirmed",
  "appointment_reminder",
  "appointment_modified",
  "appointment_cancelled",
  "payment_recorded",
  "installment_due",
  "installment_overdue",
];
