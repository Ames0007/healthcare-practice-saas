import type { ActiveConsultation } from "@/components/domain/clinical/types";
import { PATIENTS_TODAY_DATE } from "@/features/patients/mock-data";

/**
 * Centralized synthetic active-consultation fixtures (UI-005C §10) — no
 * real medical records. cons-1/pat-1 (Ahmed) is an in-progress draft
 * dated on the fixed prototype "today" (`PATIENTS_TODAY_DATE`, an active
 * consultation is inherently a today event — the task's own §11 wireframe
 * illustrative date is not treated as a strict requirement, documented in
 * the completion report), continuing the same "Rééducation genou" thread
 * as UI-005B's own historical fixtures for this patient, at a distinct
 * time (15:30) from that morning's already-completed 10:00 consultation
 * (`enc-1`, `mock-clinical-encounters-data.ts`) so the two do not read as
 * contradicting duplicates. cons-2/pat-4 (Youssef) is already `completed`
 * — a fixture dedicated to exercising the read-only completed state,
 * kept on a different patient than cons-1 to avoid narrative overlap.
 */
export function getActiveConsultationsMockData(): ActiveConsultation[] {
  return [
    {
      id: "cons-1",
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      appointmentId: "RDV-2026-1043",
      date: PATIENTS_TODAY_DATE,
      time: "15:30",
      status: "draft",
      reason: "Contrôle post-traitement",
      observations: "Amélioration progressive, moins de raideur le matin.",
      assessment: "",
      plan: "",
    },
    {
      id: "cons-2",
      patientId: "pat-4",
      practitionerId: "pr-2",
      practitionerName: "Dr. Amal",
      date: "2026-08-20",
      time: "09:30",
      status: "completed",
      reason: "Contrôle dentaire de routine",
      observations: "Aucune carie détectée, gencives saines.",
      assessment: "Bonne hygiène bucco-dentaire.",
      plan: "Prochain contrôle dans 6 mois.",
      completedAt: "2026-08-20",
    },
  ];
}

export function getEmptyActiveConsultationsMockData(): ActiveConsultation[] {
  return [];
}
