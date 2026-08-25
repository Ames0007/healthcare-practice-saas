import { describe, expect, it } from "vitest";
import { getPatientsMockData, PRACTITIONERS } from "@/features/patients/mock-data";
import { getTreatmentPlansMockData } from "@/features/patients/mock-treatments-data";
import { getEncountersForPatient, sortEncountersDesc } from "./clinical-history";
import { getClinicalEncountersMockData, getEmptyClinicalEncountersMockData } from "./mock-clinical-encounters-data";

describe("clinical encounter fixture integrity", () => {
  const encounters = getClinicalEncountersMockData();
  const patientIds = new Set(getPatientsMockData().map((patient) => patient.id));
  const practitionerIds = new Set(PRACTITIONERS.map((practitioner) => practitioner.id));

  it("every encounter references an existing patient", () => {
    encounters.forEach((encounter) => {
      expect(patientIds.has(encounter.patientId)).toBe(true);
    });
  });

  it("every encounter's practitioner id/name pair matches a real practitioner", () => {
    encounters.forEach((encounter) => {
      expect(practitionerIds.has(encounter.practitionerId)).toBe(true);
      const practitioner = PRACTITIONERS.find((candidate) => candidate.id === encounter.practitionerId);
      expect(practitioner?.name).toBe(encounter.practitionerName);
    });
  });

  it("encounter ids are unique", () => {
    const ids = encounters.map((encounter) => encounter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("consultation encounters carry structured reason/observations/assessment/plan, never session-only fields", () => {
    encounters
      .filter((encounter) => encounter.encounterType === "consultation")
      .forEach((encounter) => {
        expect(encounter.reason).toBeTruthy();
        expect(encounter.treatmentPlanId).toBeUndefined();
        expect(encounter.sessionSequenceNumber).toBeUndefined();
      });
  });

  it("session encounters carry treatment linkage, never consultation-only structured detail", () => {
    encounters
      .filter((encounter) => encounter.encounterType === "session")
      .forEach((encounter) => {
        expect(encounter.treatmentPlanId).toBeTruthy();
        expect(encounter.observations).toBeUndefined();
        expect(encounter.assessment).toBeUndefined();
        expect(encounter.plan).toBeUndefined();
      });
  });

  it("a session encounter's treatment reference resolves to a real TreatmentPlan/TreatmentSession and does not contradict it (§12)", () => {
    const plans = getTreatmentPlansMockData();

    encounters
      .filter((encounter) => encounter.encounterType === "session")
      .forEach((encounter) => {
        const plan = plans.find((candidate) => candidate.id === encounter.treatmentPlanId);
        expect(plan).toBeDefined();
        expect(plan?.title).toBe(encounter.treatmentPlanTitle);
        expect(plan?.patientId).toBe(encounter.patientId);

        const session = plan?.sessions.find((candidate) => candidate.sequenceNumber === encounter.sessionSequenceNumber);
        expect(session).toBeDefined();
        expect(session?.status).toBe("completed");
        expect(session?.scheduledDate).toBe(encounter.date);
        expect(session?.scheduledTime).toBe(encounter.time);
        expect(session?.practitionerName).toBe(encounter.practitionerName);
        expect(session?.appointmentId).toBe(encounter.appointmentId);
        expect(encounter.sessionTotalCount).toBe(plan?.sessions.length);
      });
  });

  it("Patient A (pat-1) has two completed consultations and one completed session, newest first", () => {
    const patientEncounters = sortEncountersDesc(getEncountersForPatient(encounters, "pat-1"));
    expect(patientEncounters.map((encounter) => encounter.encounterType)).toEqual(["consultation", "consultation", "session"]);
    expect(patientEncounters.map((encounter) => encounter.date)).toEqual(["2026-08-23", "2026-08-18", "2026-08-15"]);
  });

  it("Patient B (pat-3) and Patient C (pat-2) have no clinical-history fixture at all (empty by omission)", () => {
    expect(getEncountersForPatient(encounters, "pat-3")).toEqual([]);
    expect(getEncountersForPatient(encounters, "pat-2")).toEqual([]);
  });
});

describe("getEmptyClinicalEncountersMockData", () => {
  it("returns an empty array for direct empty-state test injection", () => {
    expect(getEmptyClinicalEncountersMockData()).toEqual([]);
  });
});
