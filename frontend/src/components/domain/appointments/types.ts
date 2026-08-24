/**
 * Full appointment state machine (Spec #2 §57.1, Spec #3 §3.1, CLAUDE.md
 * §16). Lives in the domain layer (not a feature folder) because both
 * Aujourd'hui (UI-001) and Agenda (UI-002) depend on it.
 */
export type AppointmentStatus =
  | "requested"
  | "to_confirm"
  | "confirmed"
  | "arrived"
  | "waiting"
  | "in_consultation"
  | "completed"
  | "rescheduled"
  | "cancelled_by_patient"
  | "cancelled_by_practice"
  | "no_show";

/** CLAUDE.md §15 — the two V1 scheduling modes, stored distinctly. */
export type AppointmentSchedulingType = "exact" | "window";
