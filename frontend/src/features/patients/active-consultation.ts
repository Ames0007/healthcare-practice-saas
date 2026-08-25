import type { ActiveConsultation, ClinicalEncounter } from "@/components/domain/clinical/types";

export function getActiveConsultationById(consultations: ActiveConsultation[], consultationId: string): ActiveConsultation | null {
  return consultations.find((consultation) => consultation.id === consultationId) ?? null;
}

/** Required before completion (§16) — a draft may be saved with this empty. */
export function isConsultationCompletionValid(consultation: ActiveConsultation): boolean {
  return consultation.reason.trim().length > 0;
}

/** Compares only the practitioner-editable fields — never `status`/`completedAt`, which the workspace itself controls (§23). */
export function isConsultationDirty(current: ActiveConsultation, savedSnapshot: ActiveConsultation): boolean {
  return (
    current.reason !== savedSnapshot.reason ||
    (current.observations ?? "") !== (savedSnapshot.observations ?? "") ||
    (current.assessment ?? "") !== (savedSnapshot.assessment ?? "") ||
    (current.plan ?? "") !== (savedSnapshot.plan ?? "")
  );
}

/**
 * Pure transformation into the historical `ClinicalEncounter` shape
 * (UI-005B) — proves a completed `ActiveConsultation` is representable as
 * history without inventing a second, incompatible clinical model (§9).
 * Only meaningful for a `completed` consultation with a non-empty reason;
 * callers are expected to have already enforced completion validity.
 */
export function toClinicalEncounter(consultation: ActiveConsultation): ClinicalEncounter {
  return {
    id: consultation.id,
    patientId: consultation.patientId,
    encounterType: "consultation",
    date: consultation.date,
    time: consultation.time,
    practitionerId: consultation.practitionerId,
    practitionerName: consultation.practitionerName,
    appointmentId: consultation.appointmentId,
    status: "completed",
    reason: consultation.reason,
    observations: consultation.observations,
    assessment: consultation.assessment,
    plan: consultation.plan,
  };
}
