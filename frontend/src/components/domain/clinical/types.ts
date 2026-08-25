/**
 * Medical-profile prototype model (UI-005A §9-10, Spec #4 §9.3
 * `patient_health_flags` simplified to this task's own bounded shape).
 * Domain-owned, deliberately separate from `features/patients/types.ts`'s
 * administrative `Patient` (CLAUDE.md §8/§12) — clinical governance and
 * administrative access are different concerns, so they stay different
 * types even in this frontend-only prototype.
 */
export type ClinicalCategory = "allergy" | "history" | "medication";

/** Kept intentionally minimal per UI-005A §20 — no detailed allergy-reaction taxonomy in this task. */
export type AllergyImportance = "standard" | "important";

export interface MedicalProfileEntry {
  id: string;
  /** Set when the entry was selected from `features/clinical/master-data.ts`; absent for a practitioner-typed custom entry. */
  masterDataId?: string;
  label: string;
  /** `true` for a practitioner-typed value not present in master data — never written back into the shared catalog (§15). */
  custom: boolean;
  /** Only meaningful for allergy entries — absent (never rendered) for history/medication entries. */
  importance?: AllergyImportance;
}

export interface MedicalProfile {
  patientId: string;
  allergies: MedicalProfileEntry[];
  medicalHistory: MedicalProfileEntry[];
  /** The patient's own current medications/treatments — NOT UI-004C's `TreatmentPlan` (kiné session plans); the two concepts stay separate (§22). */
  currentMedications: MedicalProfileEntry[];
  /** Each string is one short practitioner-entered note; the edit UI presents them as one combined textarea (§26's single field), split back into entries on save. */
  importantNotes: string[];
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}
