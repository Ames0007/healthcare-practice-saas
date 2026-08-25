import type { MedicalProfile } from "@/components/domain/clinical/types";

/**
 * Centralized synthetic medical-profile fixtures (UI-005A §38) — no real
 * patient data (CLAUDE.md §12/§13). pat-1/Ahmed (Patient A) demonstrates a
 * fully populated profile including one "important" allergy. pat-3/Fatima
 * (Patient B) demonstrates a partial profile: some history, no allergies,
 * no current medications. pat-2/Sara (Patient C) deliberately has no
 * fixture entry at all — the same "fully empty by omission" convention
 * already used for invoices/payments (UI-004D/E).
 */
export function getMedicalProfilesMockData(): MedicalProfile[] {
  return [
    {
      patientId: "pat-1",
      allergies: [
        { id: "mp-pat1-allergy-1", masterDataId: "mdi-allergy-penicilline", label: "Pénicilline", custom: false, importance: "important" },
      ],
      medicalHistory: [
        { id: "mp-pat1-history-1", masterDataId: "mdi-history-hta", label: "Hypertension artérielle", custom: false },
      ],
      currentMedications: [
        { id: "mp-pat1-medication-1", masterDataId: "mdi-medication-amlodipine", label: "Amlodipine", custom: false },
      ],
      importantNotes: ["Précaution particulière avant intervention."],
      lastUpdatedAt: "2026-08-23",
      lastUpdatedBy: "Dr. Benali",
    },
    {
      patientId: "pat-3",
      allergies: [],
      medicalHistory: [{ id: "mp-pat3-history-1", masterDataId: "mdi-history-asthme", label: "Asthme", custom: false }],
      currentMedications: [],
      importantNotes: [],
      lastUpdatedAt: "2026-07-10",
      lastUpdatedBy: "Dr. Amal",
    },
  ];
}

export function getEmptyMedicalProfilesMockData(): MedicalProfile[] {
  return [];
}
