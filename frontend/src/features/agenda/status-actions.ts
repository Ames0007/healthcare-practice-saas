import type { AppointmentStatus } from "@/components/domain/appointments/types";

export interface LifecycleAction {
  /** `null` = future-feature placeholder (§58), no local state transition. */
  targetStatus: AppointmentStatus | null;
  translationKey: string;
}

/**
 * Central state-aware primary-action registry (Spec #7 §7, UI-002 §15).
 * Shared by the Appointment Drawer and Waiting Room so both surfaces
 * offer the same next action for the same status (§40). Statuses absent
 * from this map (completed, no_show, rescheduled, cancelled_*, requested)
 * have no primary lifecycle action.
 */
export const APPOINTMENT_PRIMARY_ACTION: Partial<Record<AppointmentStatus, LifecycleAction>> = {
  to_confirm: { targetStatus: "confirmed", translationKey: "agenda.actions.confirm" },
  confirmed: { targetStatus: "arrived", translationKey: "agenda.actions.markArrived" },
  arrived: { targetStatus: "waiting", translationKey: "agenda.actions.markWaiting" },
  waiting: { targetStatus: "in_consultation", translationKey: "agenda.actions.start" },
  in_consultation: { targetStatus: null, translationKey: "agenda.actions.openConsultation" },
};

/** Statuses from which "Absent" (no-show) is offered (§32). */
export const NO_SHOW_ELIGIBLE_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  "to_confirm",
  "confirmed",
  "arrived",
  "waiting",
]);
