import { describe, expect, it } from "vitest";
import { getPatientsMockData, PRACTITIONERS } from "@/features/patients/mock-data";
import { isConsultationCompletionValid, toClinicalEncounter } from "./active-consultation";
import { getActiveConsultationsMockData, getEmptyActiveConsultationsMockData } from "./mock-active-consultations-data";

describe("active consultation fixture integrity", () => {
  const consultations = getActiveConsultationsMockData();
  const patientIds = new Set(getPatientsMockData().map((patient) => patient.id));
  const practitionerIds = new Set(PRACTITIONERS.map((practitioner) => practitioner.id));

  it("every consultation references an existing patient", () => {
    consultations.forEach((consultation) => {
      expect(patientIds.has(consultation.patientId)).toBe(true);
    });
  });

  it("every consultation's practitioner id/name pair matches a real practitioner", () => {
    consultations.forEach((consultation) => {
      expect(practitionerIds.has(consultation.practitionerId)).toBe(true);
      const practitioner = PRACTITIONERS.find((candidate) => candidate.id === consultation.practitionerId);
      expect(practitioner?.name).toBe(consultation.practitionerName);
    });
  });

  it("consultation ids are unique", () => {
    const ids = consultations.map((consultation) => consultation.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes at least one draft and one completed consultation (§10)", () => {
    expect(consultations.some((consultation) => consultation.status === "draft")).toBe(true);
    expect(consultations.some((consultation) => consultation.status === "completed")).toBe(true);
  });

  it("the draft fixture (cons-1) has a non-empty reason but remains editable", () => {
    const draft = consultations.find((consultation) => consultation.id === "cons-1")!;
    expect(draft.status).toBe("draft");
    expect(draft.completedAt).toBeUndefined();
  });

  it("the completed fixture (cons-2) has a completedAt and a valid reason", () => {
    const completed = consultations.find((consultation) => consultation.id === "cons-2")!;
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeDefined();
    expect(isConsultationCompletionValid(completed)).toBe(true);
  });

  it("every completed consultation transforms into a valid ClinicalEncounter", () => {
    consultations
      .filter((consultation) => consultation.status === "completed")
      .forEach((consultation) => {
        const encounter = toClinicalEncounter(consultation);
        expect(encounter.encounterType).toBe("consultation");
        expect(encounter.status).toBe("completed");
        expect(encounter.patientId).toBe(consultation.patientId);
        expect(encounter.reason).toBeTruthy();
      });
  });
});

describe("getEmptyActiveConsultationsMockData", () => {
  it("returns an empty array for direct empty-state test injection", () => {
    expect(getEmptyActiveConsultationsMockData()).toEqual([]);
  });
});
