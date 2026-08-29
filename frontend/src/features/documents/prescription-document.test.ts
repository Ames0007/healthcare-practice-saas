import { describe, expect, it } from "vitest";
import { getPrescriptionsMockData } from "@/features/patients/mock-prescriptions-data";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getDocumentSettingsMockData } from "@/features/parametres/mock-document-settings-data";
import { buildPrescriptionDocument } from "./prescription-document";

const prescription = getPrescriptionsMockData().find((candidate) => candidate.id === "presc-1")!;
const cabinet = getCabinetProfileMockData();
const documentSettings = getDocumentSettingsMockData();

describe("buildPrescriptionDocument (UI-DOCS-X §20-22)", () => {
  it("reuses the prescription's own reference for display, but the patient number + date for the filename (task §11 example)", () => {
    const model = buildPrescriptionDocument(prescription, "Ahmed Alaoui", "PAT-00281", cabinet, documentSettings);
    expect(model.reference).toBe(prescription.prescriptionNumber);
    expect(model.filename).toBe("Ordonnance-PAT-00281-2026-08-23.pdf");
  });

  it("renders every practitioner-entered medication item verbatim, never altering/inferring content (§21)", () => {
    const model = buildPrescriptionDocument(prescription, "Ahmed Alaoui", "PAT-00281", cabinet, documentSettings);
    expect(model.items).toHaveLength(prescription.items.length);
    expect(model.items[0].medication).toBe(prescription.items[0].medication);
    expect(model.items[0].dosage).toBe(prescription.items[0].dosage);
    expect(model.items[0].frequency).toBe(prescription.items[0].frequency);
  });

  it("never includes finance, social-coverage, or unrelated clinical-history data (§22)", () => {
    const model = buildPrescriptionDocument(prescription, "Ahmed Alaoui", "PAT-00281", cabinet, documentSettings);
    expect(model).not.toHaveProperty("allergies");
    expect(model).not.toHaveProperty("medicalHistory");
    expect(model).not.toHaveProperty("isSociallyCovered");
    expect(model).not.toHaveProperty("insuranceRegime");
    expect(model).not.toHaveProperty("totalAmount");
    expect(model).not.toHaveProperty("invoiceNumber");
  });

  it("never includes internal React/debug/audit metadata (§34)", () => {
    const model = buildPrescriptionDocument(prescription, "Ahmed Alaoui", "PAT-00281", cabinet, documentSettings);
    const serialized = JSON.stringify(model);
    expect(serialized).not.toMatch(/practitionerId|patientId|consultationId/i);
  });
});
