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

/**
 * Clinical-history prototype model (UI-005B §8-9, Spec #4 §9.1
 * `clinical_encounters` simplified to this task's own bounded shape).
 * Only the two encounter types this task needs — not a generic EHR event
 * system (§8). All historical encounters in this bounded prototype are
 * `completed`; no larger status registry is introduced (§16).
 */
export type ClinicalEncounterType = "consultation" | "session";

export type ClinicalEncounterStatus = "completed";

export interface ClinicalEncounter {
  id: string;
  patientId: string;
  encounterType: ClinicalEncounterType;
  /** ISO date, e.g. "2026-08-23". */
  date: string;
  time?: string;
  practitionerId: string;
  practitionerName: string;
  /** Opaque prototype display reference (e.g. "RDV-2026-1042") — mirrors `TreatmentSession.appointmentId`; not a real cross-linked Agenda record id. */
  appointmentId?: string;
  status: ClinicalEncounterStatus;
  /** Consultation-only: short motif, reused both as the timeline card preview and the read-only detail drawer's first structured section. */
  reason?: string;
  /** Consultation-only structured detail sections (§21) — always absent for session encounters, which stay concise (§24-25). */
  observations?: string;
  assessment?: string;
  plan?: string;
  /** Session-only: the related `TreatmentPlan` (UI-004C) this session belongs to — never duplicates its progress, only links to it (§26). */
  treatmentPlanId?: string;
  treatmentPlanTitle?: string;
  sessionSequenceNumber?: number;
  sessionTotalCount?: number;
}
