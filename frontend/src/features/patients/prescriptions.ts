import type { Prescription, PrescriptionItem } from "@/components/domain/clinical/types";

export function getPrescriptionsForPatient(prescriptions: Prescription[], patientId: string): Prescription[] {
  return prescriptions.filter((prescription) => prescription.patientId === patientId);
}

/** Newest first — explicit derivation, never fixture insertion order. */
export function sortPrescriptionsDesc(prescriptions: Prescription[]): Prescription[] {
  return [...prescriptions].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

/** Illustrative sequential prototype numbering only — real numbering is concurrency-safe and server-controlled (§37, mirrors `generatePaymentNumber`). */
export function generatePrescriptionNumber(existingCount: number): string {
  return `ORD-2026-${String(existingCount + 1).padStart(4, "0")}`;
}

export type PrescriptionItemDraft = Pick<PrescriptionItem, "medication" | "dosage" | "frequency" | "duration" | "instructions">;

/** Form-completeness only — medication/dosage/frequency required, duration/instructions optional (§35). Never validates medical correctness. */
export function isPrescriptionItemValid(item: PrescriptionItemDraft): boolean {
  return item.medication.trim().length > 0 && item.dosage.trim().length > 0 && item.frequency.trim().length > 0;
}

/** At least one valid item is required to create a prescription (§34). */
export function isPrescriptionFormValid(items: PrescriptionItemDraft[]): boolean {
  return items.length > 0 && items.every(isPrescriptionItemValid);
}
