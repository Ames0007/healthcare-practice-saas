import type { ClinicalDocument } from "@/components/domain/clinical/types";

/**
 * Centralized synthetic clinical-document fixtures (UI-005D §11) — no
 * real patient files, no raw file contents (CLAUDE.md §12/§13, §19 of
 * this task). pat-1/Ahmed has four documents spanning all but one
 * category, three of them cross-referencing UI-005B's own
 * `ClinicalEncounter` fixtures (`enc-1`/`enc-2`/`enc-3`,
 * `mock-clinical-encounters-data.ts`) rather than inventing
 * contradicting consultation references; the fourth (an externally
 * scanned prescription) deliberately carries no `consultationId` and
 * demonstrates the `"prescription"` document category exists
 * independently of the structured `Prescription` records in
 * `mock-prescriptions-data.ts` — the two are never auto-synchronized
 * (§42). pat-2/Sara deliberately has no fixture entry at all — the same
 * "empty by omission" convention as every other Dossier Santé fixture
 * set in this prototype.
 */
export function getClinicalDocumentsMockData(): ClinicalDocument[] {
  return [
    {
      id: "doc-1",
      patientId: "pat-1",
      category: "analysis",
      title: "Résultats biologiques",
      fileName: "resultats-biologiques.pdf",
      mimeType: "application/pdf",
      sizeBytes: 456_000,
      uploadedAt: "2026-08-23",
      uploadedBy: "Dr. Benali",
      consultationId: "enc-1",
    },
    {
      id: "doc-2",
      patientId: "pat-1",
      category: "imaging",
      title: "Radiographie genou",
      fileName: "radiographie-genou.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 1_258_291,
      uploadedAt: "2026-08-18",
      uploadedBy: "Dr. Benali",
      consultationId: "enc-2",
    },
    {
      id: "doc-3",
      patientId: "pat-1",
      category: "report",
      title: "Compte-rendu de séance",
      fileName: "compte-rendu-seance.pdf",
      mimeType: "application/pdf",
      sizeBytes: 182_000,
      uploadedAt: "2026-08-15",
      uploadedBy: "Dr. Benali",
      consultationId: "enc-3",
    },
    {
      id: "doc-4",
      patientId: "pat-1",
      category: "prescription",
      title: "Ordonnance externe (scannée)",
      fileName: "ordonnance-externe.pdf",
      mimeType: "application/pdf",
      sizeBytes: 95_000,
      uploadedAt: "2026-07-10",
      uploadedBy: "Dr. Benali",
      description: "Ordonnance apportée par le patient, établie par un autre praticien.",
    },
  ];
}

export function getEmptyClinicalDocumentsMockData(): ClinicalDocument[] {
  return [];
}
