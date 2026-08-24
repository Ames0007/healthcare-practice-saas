/**
 * Treatment/session prototype model (UI-004C §7-8, Spec #4 §14 —
 * simplified for this frontend prototype per this task's own explicit
 * status lists, e.g. `no_show`/`unscheduled` instead of the backend's
 * `missed`/`planned`). Domain-owned, mirroring `domain/appointments/types.ts`
 * — features/patients depends on this layer, not the other way around.
 */

export type TreatmentPlanStatus = "active" | "completed" | "paused" | "cancelled";

export type TreatmentSessionStatus = "completed" | "scheduled" | "unscheduled" | "cancelled" | "no_show";

export interface TreatmentSession {
  id: string;
  treatmentPlanId: string;
  sequenceNumber: number;
  status: TreatmentSessionStatus;
  /** Set for scheduled and completed sessions; absent for unscheduled ones. */
  scheduledDate?: string;
  scheduledTime?: string;
  /** Opaque prototype display reference (e.g. "RDV-2026-1000") — not a real cross-linked Agenda id. */
  appointmentId?: string;
  completedAt?: string;
  practitionerName?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  practitionerId: string;
  practitionerName: string;
  startDate: string;
  /** Nominal target session count from the plan; `sessions.length` is the authoritative count actually rendered. */
  plannedSessions: number;
  status: TreatmentPlanStatus;
  description?: string;
  /** Set once `status === "completed"` (Spec #9 Screen 17's "Terminé le 15 juillet 2026"). */
  completedDate?: string;
  sessions: TreatmentSession[];
}
