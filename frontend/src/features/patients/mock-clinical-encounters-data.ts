import type { ClinicalEncounter } from "@/components/domain/clinical/types";

/**
 * Centralized synthetic clinical-history fixtures (UI-005B §11-12) — no
 * real medical records (CLAUDE.md §12/§13). pat-1/Ahmed (Patient A)
 * demonstrates two completed consultations plus one completed treatment
 * session: the 23 August consultation aligns with the existing UI-004A
 * activity fixture (`act-1`, "consultationCompleted" on 2026-08-23,
 * `mock-overview-data.ts`), and the session reuses the exact date/
 * practitioner/appointment reference of the 6th completed session in the
 * "Rééducation genou" plan (`tp-1-s6`, `mock-treatments-data.ts`) rather
 * than inventing a contradicting duplicate. pat-3/Fatima deliberately has
 * no fixture entry despite having a populated `MedicalProfile` (UI-005A),
 * demonstrating "MedicalProfile but no clinical history" (§29). pat-2/
 * Sara deliberately has no fixture entry either — the same "empty by
 * omission" convention already used for invoices/payments/medical
 * profiles (UI-004D/E/UI-005A) — demonstrating the fully empty Dossier
 * Santé (§31).
 */
export function getClinicalEncountersMockData(): ClinicalEncounter[] {
  return [
    {
      id: "enc-1",
      patientId: "pat-1",
      encounterType: "consultation",
      date: "2026-08-23",
      time: "10:00",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      appointmentId: "RDV-2026-1042",
      status: "completed",
      reason: "Douleur au genou",
      observations: "Douleur à la flexion, légère raideur matinale.",
      assessment: "Gonalgie mécanique, pas de signe inflammatoire aigu.",
      plan: "Poursuite de la rééducation, réévaluation dans 2 semaines.",
    },
    {
      id: "enc-2",
      patientId: "pat-1",
      encounterType: "consultation",
      date: "2026-08-18",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      status: "completed",
      reason: "Suivi",
      observations: "Amélioration de la mobilité, douleur réduite.",
      assessment: "Évolution favorable.",
      plan: "Poursuite du programme de séances prévues.",
    },
    {
      id: "enc-3",
      patientId: "pat-1",
      encounterType: "session",
      date: "2026-08-15",
      time: "15:00",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      appointmentId: "RDV-2026-1005",
      status: "completed",
      treatmentPlanId: "tp-1",
      treatmentPlanTitle: "Rééducation genou",
      sessionSequenceNumber: 6,
      sessionTotalCount: 20,
    },
  ];
}

export function getEmptyClinicalEncountersMockData(): ClinicalEncounter[] {
  return [];
}
