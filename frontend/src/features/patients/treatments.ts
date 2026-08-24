import type { PatientActiveTreatment } from "@/components/domain/patients/types";
import type { TreatmentPlan, TreatmentSession } from "@/components/domain/treatments/types";

export function getTreatmentPlansForPatient(plans: TreatmentPlan[], patientId: string): TreatmentPlan[] {
  return plans.filter((plan) => plan.patientId === patientId);
}

/**
 * Only `status === "active"` counts as the "TRAITEMENT ACTIF" section
 * (UI-004C §12); everything else (completed, and any future paused/
 * cancelled fixture) falls into the denser "TRAITEMENTS TERMINÉS"-style
 * list rather than disappearing silently — this task's fixtures only seed
 * active/completed plans, per §11's own "do not invent more statuses than
 * needed" guidance.
 */
export function splitActiveAndCompleted(plans: TreatmentPlan[]): { active: TreatmentPlan[]; completed: TreatmentPlan[] } {
  return {
    active: plans.filter((plan) => plan.status === "active"),
    completed: plans.filter((plan) => plan.status !== "active"),
  };
}

export function countSessionsByStatus(sessions: TreatmentSession[]): { completed: number; scheduled: number } {
  return {
    completed: sessions.filter((session) => session.status === "completed").length,
    scheduled: sessions.filter((session) => session.status === "scheduled").length,
  };
}

/** "Prochaine séance" (Spec #9 Screen 17/22) — the earliest scheduled session by date/time. */
export function findNextSession(sessions: TreatmentSession[]): TreatmentSession | null {
  const scheduled = sessions.filter((session) => session.status === "scheduled" && session.scheduledDate);
  if (scheduled.length === 0) {
    return null;
  }

  return [...scheduled].sort((a, b) => {
    const dateCompare = a.scheduledDate!.localeCompare(b.scheduledDate!);
    return dateCompare !== 0 ? dateCompare : (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? "");
  })[0];
}

/**
 * Derives the Aperçu overview's active-treatment summary from these same
 * fixtures (UI-004C §33) instead of a hand-duplicated number, so the
 * overview card and the Treatments tab can never disagree.
 */
export function getActiveTreatmentSummary(plans: TreatmentPlan[]): PatientActiveTreatment | null {
  const active = plans.find((plan) => plan.status === "active");
  if (!active) {
    return null;
  }

  const { completed } = countSessionsByStatus(active.sessions);
  return { name: active.title, completedSessions: completed, totalSessions: active.sessions.length };
}
