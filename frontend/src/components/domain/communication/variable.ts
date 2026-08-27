import type { CommunicationVariableKey } from "./types";

interface CommunicationVariableMeta {
  translationKey: string;
  /** The literal `{{token}}` this key resolves in a template body. */
  token: string;
}

/**
 * Central variable registry (UI-009ABC §27) — one place mapping every
 * allowed `{{token}}` to its label, instead of scattering string-
 * replacement rules through components (§27's own instruction).
 */
export const COMMUNICATION_VARIABLE_MAP: Record<CommunicationVariableKey, CommunicationVariableMeta> = {
  patient_first_name: { translationKey: "communication.variable.patient_first_name", token: "{{patient_first_name}}" },
  patient_name: { translationKey: "communication.variable.patient_name", token: "{{patient_name}}" },
  appointment_date: { translationKey: "communication.variable.appointment_date", token: "{{appointment_date}}" },
  appointment_time: { translationKey: "communication.variable.appointment_time", token: "{{appointment_time}}" },
  practitioner_name: { translationKey: "communication.variable.practitioner_name", token: "{{practitioner_name}}" },
  cabinet_name: { translationKey: "communication.variable.cabinet_name", token: "{{cabinet_name}}" },
  invoice_number: { translationKey: "communication.variable.invoice_number", token: "{{invoice_number}}" },
  amount_due: { translationKey: "communication.variable.amount_due", token: "{{amount_due}}" },
  remaining_balance: { translationKey: "communication.variable.remaining_balance", token: "{{remaining_balance}}" },
  installment_due_date: { translationKey: "communication.variable.installment_due_date", token: "{{installment_due_date}}" },
};

/** Deterministic iteration order for the editor's VARIABLES reference list (Spec #9 Screen 42). */
export const COMMUNICATION_VARIABLE_ORDER: CommunicationVariableKey[] = [
  "patient_first_name",
  "patient_name",
  "appointment_date",
  "appointment_time",
  "practitioner_name",
  "cabinet_name",
  "invoice_number",
  "amount_due",
  "remaining_balance",
  "installment_due_date",
];
