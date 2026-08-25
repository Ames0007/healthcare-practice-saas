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

/**
 * Active-consultation prototype model (UI-005C §7-8, Spec #4 §9.1
 * `clinical_encounters`' `status` column simplified further still — only
 * the two states this task needs, not the domain spec's full
 * draft/active/completed/amended set (§7). Deliberately shaped so a
 * completed `ActiveConsultation` is a near-direct match for
 * `ClinicalEncounter`'s own consultation fields (§9) — see
 * `features/patients/active-consultation.ts`'s `toClinicalEncounter` pure
 * transformation.
 */
export type ConsultationStatus = "draft" | "completed";

export interface ActiveConsultation {
  id: string;
  patientId: string;
  practitionerId: string;
  practitionerName: string;
  appointmentId?: string;
  date: string;
  time?: string;
  status: ConsultationStatus;
  /** Required before completion (§16); a draft may be saved with this empty. */
  reason: string;
  observations?: string;
  assessment?: string;
  plan?: string;
  /** Fixed prototype "now" (`PATIENTS_TODAY_DATE`), never a real server timestamp (§29). */
  completedAt?: string;
}

/**
 * Clinical-document prototype model (UI-005D §8-9, Spec #4 §10.2
 * `patient_documents` simplified — no `files`/object-storage row, since
 * no real file is ever stored (§19). `prescription` is a valid category
 * for a document that arrived as a file (e.g. a scanned external
 * prescription) — it is never auto-populated from `Prescription` records
 * below; the two stay independent (§42).
 */
export type ClinicalDocumentCategory = "analysis" | "imaging" | "report" | "prescription" | "other";

export interface ClinicalDocument {
  id: string;
  patientId: string;
  category: ClinicalDocumentCategory;
  title: string;
  /** Display-only synthetic filename — no real file, no stored path (§19). */
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  /** References a historical `ClinicalEncounter.id` (UI-005B) where the document originated from a consultation/session. */
  consultationId?: string;
  description?: string;
}

/**
 * Structured prescription prototype model (UI-005D §25-26) — Spec #4
 * §10.3's `generated_documents` treats a prescription as one more
 * `document_kind` alongside invoices/receipts/certificates, with no
 * dedicated item-level structure. This task's own explicit model requires
 * structured medication items, so `Prescription`/`PrescriptionItem` are a
 * deliberate, documented extension of that generic shape for this bounded
 * prototype — not a contradiction of it (a future generated PDF would
 * still be recorded as one `generated_documents` row referencing this
 * record). Kept intentionally minimal: only `issued` is ever produced by
 * this prototype (no cancellation workflow, §31); `cancelled` exists in
 * the type for shape-fidelity with a real future backend, matching the
 * task's own two-value sketch, without inventing UI to reach it.
 */
export type PrescriptionStatus = "issued" | "cancelled";

export interface PrescriptionItem {
  id: string;
  /** Practitioner-entered free text — never suggested/validated against a drug database (§27). */
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  practitionerId: string;
  practitionerName: string;
  issuedAt: string;
  /** References a historical `ClinicalEncounter.id` (UI-005B) when the prescription originated from a consultation. */
  consultationId?: string;
  items: PrescriptionItem[];
  instructions?: string;
  status: PrescriptionStatus;
}
