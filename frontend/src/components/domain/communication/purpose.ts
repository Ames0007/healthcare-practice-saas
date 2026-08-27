import type { CommunicationPurpose } from "./types";

interface CommunicationPurposeMeta {
  translationKey: string;
}

/**
 * Central purpose → label registry (UI-009ABC §23-24), mirroring
 * `INVENTORY_CATEGORY_MAP`'s pattern. Drives both the message history
 * table's "Type" column (Spec #9 Screen 41) and the template editor's
 * purpose selector (Gate 2).
 */
export const COMMUNICATION_PURPOSE_MAP: Record<CommunicationPurpose, CommunicationPurposeMeta> = {
  appointment_confirmation: { translationKey: "communication.purpose.appointment_confirmation" },
  appointment_reminder: { translationKey: "communication.purpose.appointment_reminder" },
  appointment_change: { translationKey: "communication.purpose.appointment_change" },
  appointment_cancellation: { translationKey: "communication.purpose.appointment_cancellation" },
  booking_request_response: { translationKey: "communication.purpose.booking_request_response" },
  payment_confirmation: { translationKey: "communication.purpose.payment_confirmation" },
  installment_reminder: { translationKey: "communication.purpose.installment_reminder" },
  overdue_payment_reminder: { translationKey: "communication.purpose.overdue_payment_reminder" },
  follow_up: { translationKey: "communication.purpose.follow_up" },
  next_session_reminder: { translationKey: "communication.purpose.next_session_reminder" },
  custom_operational: { translationKey: "communication.purpose.custom_operational" },
};

/** Deterministic iteration order for filters/forms — Select options never rely on object key order. */
export const COMMUNICATION_PURPOSE_ORDER: CommunicationPurpose[] = [
  "appointment_confirmation",
  "appointment_reminder",
  "appointment_change",
  "appointment_cancellation",
  "booking_request_response",
  "payment_confirmation",
  "installment_reminder",
  "overdue_payment_reminder",
  "follow_up",
  "next_session_reminder",
  "custom_operational",
];
