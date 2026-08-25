import { describe, expect, it } from "vitest";
import { getPatientsMockData, PRACTITIONERS } from "@/features/patients/mock-data";
import { getClinicalEncountersMockData } from "@/features/patients/mock-clinical-encounters-data";
import { isPrescriptionFormValid } from "./prescriptions";
import { getEmptyPrescriptionsMockData, getPrescriptionsMockData } from "./mock-prescriptions-data";

describe("prescription fixture integrity", () => {
  const prescriptions = getPrescriptionsMockData();
  const patientIds = new Set(getPatientsMockData().map((patient) => patient.id));
  const practitionerIds = new Set(PRACTITIONERS.map((practitioner) => practitioner.id));
  const encounterIds = new Set(getClinicalEncountersMockData().map((encounter) => encounter.id));

  it("every prescription references an existing patient", () => {
    prescriptions.forEach((prescription) => {
      expect(patientIds.has(prescription.patientId)).toBe(true);
    });
  });

  it("every prescription's practitioner id/name pair matches a real practitioner", () => {
    prescriptions.forEach((prescription) => {
      expect(practitionerIds.has(prescription.practitionerId)).toBe(true);
      const practitioner = PRACTITIONERS.find((candidate) => candidate.id === prescription.practitionerId);
      expect(practitioner?.name).toBe(prescription.practitionerName);
    });
  });

  it("prescription ids and prescriptionNumbers are unique", () => {
    const ids = prescriptions.map((prescription) => prescription.id);
    const numbers = prescriptions.map((prescription) => prescription.prescriptionNumber);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("every prescription has at least one item, and item ids are unique across the fixture set", () => {
    const allItemIds: string[] = [];
    prescriptions.forEach((prescription) => {
      expect(prescription.items.length).toBeGreaterThan(0);
      expect(isPrescriptionFormValid(prescription.items)).toBe(true);
      allItemIds.push(...prescription.items.map((item) => item.id));
    });
    expect(new Set(allItemIds).size).toBe(allItemIds.length);
  });

  it("every consultation reference resolves to a real ClinicalEncounter", () => {
    prescriptions
      .filter((prescription) => prescription.consultationId)
      .forEach((prescription) => {
        expect(encounterIds.has(prescription.consultationId as string)).toBe(true);
      });
  });

  it("Patient C (pat-2) has no prescription fixture at all (empty by omission)", () => {
    expect(prescriptions.some((prescription) => prescription.patientId === "pat-2")).toBe(false);
  });
});

describe("getEmptyPrescriptionsMockData", () => {
  it("returns an empty array for direct empty-state test injection", () => {
    expect(getEmptyPrescriptionsMockData()).toEqual([]);
  });
});
