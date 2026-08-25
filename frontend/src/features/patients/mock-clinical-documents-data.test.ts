import { describe, expect, it } from "vitest";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getClinicalEncountersMockData } from "@/features/patients/mock-clinical-encounters-data";
import { getDocumentsForPatient } from "./clinical-documents";
import { getClinicalDocumentsMockData, getEmptyClinicalDocumentsMockData } from "./mock-clinical-documents-data";

const VALID_CATEGORIES = ["analysis", "imaging", "report", "prescription", "other"];

describe("clinical document fixture integrity", () => {
  const documents = getClinicalDocumentsMockData();
  const patientIds = new Set(getPatientsMockData().map((patient) => patient.id));
  const encounterIds = new Set(getClinicalEncountersMockData().map((encounter) => encounter.id));

  it("every document references an existing patient", () => {
    documents.forEach((document) => {
      expect(patientIds.has(document.patientId)).toBe(true);
    });
  });

  it("every document has a valid category", () => {
    documents.forEach((document) => {
      expect(VALID_CATEGORIES).toContain(document.category);
    });
  });

  it("document ids are unique", () => {
    const ids = documents.map((document) => document.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no fixture carries raw file contents — only string/number metadata fields", () => {
    documents.forEach((document) => {
      Object.values(document).forEach((value) => {
        expect(["string", "number", "undefined"]).toContain(typeof value);
      });
    });
  });

  it("every consultation reference resolves to a real ClinicalEncounter", () => {
    documents
      .filter((document) => document.consultationId)
      .forEach((document) => {
        expect(encounterIds.has(document.consultationId as string)).toBe(true);
      });
  });

  it("the externally scanned prescription-category document carries no consultation reference", () => {
    const externalPrescription = documents.find((document) => document.id === "doc-4")!;
    expect(externalPrescription.category).toBe("prescription");
    expect(externalPrescription.consultationId).toBeUndefined();
  });

  it("Patient C (pat-2) has no clinical-document fixture at all (empty by omission)", () => {
    expect(getDocumentsForPatient(documents, "pat-2")).toEqual([]);
  });
});

describe("getEmptyClinicalDocumentsMockData", () => {
  it("returns an empty array for direct empty-state test injection", () => {
    expect(getEmptyClinicalDocumentsMockData()).toEqual([]);
  });
});
