import { describe, expect, it } from "vitest";
import type { ClinicalDocument } from "@/components/domain/clinical/types";
import { getDocumentsForPatient, matchesDocumentFilter, sortDocumentsDesc } from "./clinical-documents";

function makeDocument(overrides: Partial<ClinicalDocument> = {}): ClinicalDocument {
  return {
    id: "doc-x",
    patientId: "pat-1",
    category: "analysis",
    title: "Test document",
    fileName: "test.pdf",
    mimeType: "application/pdf",
    sizeBytes: 100_000,
    uploadedAt: "2026-08-10",
    uploadedBy: "Dr. Test",
    ...overrides,
  };
}

describe("getDocumentsForPatient", () => {
  it("filters by patientId only", () => {
    const documents = [makeDocument({ id: "a", patientId: "pat-1" }), makeDocument({ id: "b", patientId: "pat-2" })];
    expect(getDocumentsForPatient(documents, "pat-1").map((d) => d.id)).toEqual(["a"]);
  });
});

describe("sortDocumentsDesc", () => {
  it("orders newest upload first, independent of insertion order", () => {
    const documents = [
      makeDocument({ id: "old", uploadedAt: "2026-07-01" }),
      makeDocument({ id: "new", uploadedAt: "2026-08-20" }),
      makeDocument({ id: "mid", uploadedAt: "2026-08-01" }),
    ];
    expect(sortDocumentsDesc(documents).map((d) => d.id)).toEqual(["new", "mid", "old"]);
  });

  it("does not mutate the input array", () => {
    const documents = [makeDocument({ id: "a", uploadedAt: "2026-08-01" }), makeDocument({ id: "b", uploadedAt: "2026-08-20" })];
    sortDocumentsDesc(documents);
    expect(documents.map((d) => d.id)).toEqual(["a", "b"]);
  });
});

describe("matchesDocumentFilter", () => {
  it("matches everything for 'all'", () => {
    expect(matchesDocumentFilter(makeDocument({ category: "imaging" }), "all")).toBe(true);
  });

  it("matches only the same category otherwise", () => {
    expect(matchesDocumentFilter(makeDocument({ category: "imaging" }), "imaging")).toBe(true);
    expect(matchesDocumentFilter(makeDocument({ category: "imaging" }), "analysis")).toBe(false);
  });
});
