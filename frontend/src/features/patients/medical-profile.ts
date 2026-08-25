import type { MedicalProfile } from "@/components/domain/clinical/types";

export function getMedicalProfileForPatient(profiles: MedicalProfile[], patientId: string): MedicalProfile | null {
  return profiles.find((profile) => profile.patientId === patientId) ?? null;
}

/** `null` (no fixture at all) is treated the same as every section being empty (UI-005A §38 Patient C). */
export function isMedicalProfileEmpty(profile: MedicalProfile | null): boolean {
  if (!profile) {
    return true;
  }
  return (
    profile.allergies.length === 0 &&
    profile.medicalHistory.length === 0 &&
    profile.currentMedications.length === 0 &&
    profile.importantNotes.length === 0
  );
}
