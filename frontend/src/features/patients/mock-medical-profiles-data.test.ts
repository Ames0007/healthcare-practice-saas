import { describe, expect, it } from "vitest";
import { getClinicalMasterData } from "@/features/clinical/master-data";
import { getEmptyMedicalProfilesMockData, getMedicalProfilesMockData } from "./mock-medical-profiles-data";
import { getMedicalProfileForPatient, isMedicalProfileEmpty } from "./medical-profile";

describe("medical profile fixture integrity", () => {
  const profiles = getMedicalProfilesMockData();
  const masterData = getClinicalMasterData();

  it("Patient A (pat-1) is fully populated with one important allergy", () => {
    const profile = getMedicalProfileForPatient(profiles, "pat-1")!;
    expect(profile.allergies).toHaveLength(1);
    expect(profile.allergies[0]).toMatchObject({ label: "Pénicilline", importance: "important", custom: false });
    expect(profile.medicalHistory.length).toBeGreaterThan(0);
    expect(profile.currentMedications.length).toBeGreaterThan(0);
    expect(profile.importantNotes.length).toBeGreaterThan(0);
    expect(profile.lastUpdatedAt).toBeDefined();
    expect(profile.lastUpdatedBy).toBeDefined();
    expect(isMedicalProfileEmpty(profile)).toBe(false);
  });

  it("Patient B (pat-3) has some history but no allergies or medications", () => {
    const profile = getMedicalProfileForPatient(profiles, "pat-3")!;
    expect(profile.allergies).toEqual([]);
    expect(profile.medicalHistory.length).toBeGreaterThan(0);
    expect(profile.currentMedications).toEqual([]);
    expect(isMedicalProfileEmpty(profile)).toBe(false);
  });

  it("Patient C (pat-2) has no medical-profile fixture at all", () => {
    expect(getMedicalProfileForPatient(profiles, "pat-2")).toBeNull();
    expect(isMedicalProfileEmpty(getMedicalProfileForPatient(profiles, "pat-2"))).toBe(true);
  });

  it("no fixture category array contains a duplicate label", () => {
    profiles.forEach((profile) => {
      [profile.allergies, profile.medicalHistory, profile.currentMedications].forEach((entries) => {
        const labels = entries.map((entry) => entry.label);
        expect(new Set(labels).size).toBe(labels.length);
      });
    });
  });

  it("every entry's masterDataId, when set, resolves to a real master-data item of the matching category", () => {
    const categoryByArrayKey = {
      allergies: "allergy",
      medicalHistory: "history",
      currentMedications: "medication",
    } as const;

    profiles.forEach((profile) => {
      (Object.keys(categoryByArrayKey) as (keyof typeof categoryByArrayKey)[]).forEach((key) => {
        profile[key].forEach((entry) => {
          if (!entry.masterDataId) {
            expect(entry.custom).toBe(true);
            return;
          }
          const item = masterData.find((candidate) => candidate.id === entry.masterDataId);
          expect(item).toBeDefined();
          expect(item?.category).toBe(categoryByArrayKey[key]);
        });
      });
    });
  });
});

describe("getEmptyMedicalProfilesMockData", () => {
  it("returns an empty array for direct empty-state test injection", () => {
    expect(getEmptyMedicalProfilesMockData()).toEqual([]);
  });
});
