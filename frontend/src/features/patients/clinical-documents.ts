import type { ClinicalDocument, ClinicalDocumentCategory } from "@/components/domain/clinical/types";

export function getDocumentsForPatient(documents: ClinicalDocument[], patientId: string): ClinicalDocument[] {
  return documents.filter((document) => document.patientId === patientId);
}

/** Newest upload first — explicit derivation, never fixture insertion order (mirrors `sortEncountersDesc`). */
export function sortDocumentsDesc(documents: ClinicalDocument[]): ClinicalDocument[] {
  return [...documents].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export type DocumentFilterGroup = "all" | ClinicalDocumentCategory;

/** Lightweight category filter (§13) — no free-text document search in this bounded prototype. */
export function matchesDocumentFilter(document: ClinicalDocument, group: DocumentFilterGroup): boolean {
  return group === "all" || document.category === group;
}
