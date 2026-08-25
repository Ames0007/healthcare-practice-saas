import type { Prescription } from "@/components/domain/clinical/types";

/**
 * Centralized synthetic prescription fixtures (UI-005D §28) — harmless,
 * generic medication examples only, never a detailed realistic high-risk
 * regimen (§28's own explicit instruction). pat-1/Ahmed's prescription
 * (`ORD-2026-0018`, matching the task's own §7 example exactly) is
 * cross-referenced to UI-005B's `enc-1` consultation (2026-08-23) rather
 * than inventing a contradicting date. pat-2/Sara deliberately has no
 * fixture entry at all — the same "empty by omission" convention as
 * every other Dossier Santé fixture set in this prototype.
 */
export function getPrescriptionsMockData(): Prescription[] {
  return [
    {
      id: "presc-1",
      prescriptionNumber: "ORD-2026-0018",
      patientId: "pat-1",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      issuedAt: "2026-08-23",
      consultationId: "enc-1",
      status: "issued",
      items: [
        {
          id: "presc-1-item-1",
          medication: "Paracétamol",
          dosage: "500 mg",
          frequency: "3 fois par jour",
          duration: "5 jours",
          instructions: "À prendre après les repas.",
        },
        {
          id: "presc-1-item-2",
          medication: "Ibuprofène",
          dosage: "200 mg",
          frequency: "2 fois par jour",
          duration: "5 jours",
        },
      ],
      instructions: "Arrêter le traitement en cas de douleur abdominale et consulter.",
    },
  ];
}

export function getEmptyPrescriptionsMockData(): Prescription[] {
  return [];
}
