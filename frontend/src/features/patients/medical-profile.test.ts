import { describe, expect, it } from "vitest";
import type { MedicalProfile } from "@/components/domain/clinical/types";
import { getMedicalProfileForPatient, isMedicalProfileEmpty } from "./medical-profile";

function makeProfile(overrides: Partial<MedicalProfile> = {}): MedicalProfile {
  return {
    patientId: "pat-x",
    allergies: [],
    medicalHistory: [],
    currentMedications: [],
    importantNotes: [],
    ...overrides,
  };
}

describe("getMedicalProfileForPatient", () => {
  it("finds the profile matching the patientId", () => {
    const profiles = [makeProfile({ patientId: "pat-1" }), makeProfile({ patientId: "pat-2" })];
    expect(getMedicalProfileForPatient(profiles, "pat-2")?.patientId).toBe("pat-2");
  });

  it("returns null when no fixture exists for the patient", () => {
    expect(getMedicalProfileForPatient([], "pat-999")).toBeNull();
  });
});

describe("isMedicalProfileEmpty", () => {
  it("is true for null (no fixture at all)", () => {
    expect(isMedicalProfileEmpty(null)).toBe(true);
  });

  it("is true when every section is an empty array", () => {
    expect(isMedicalProfileEmpty(makeProfile())).toBe(true);
  });

  it("is false when allergies has at least one entry", () => {
    expect(
      isMedicalProfileEmpty(makeProfile({ allergies: [{ id: "a1", label: "Pénicilline", custom: false }] })),
    ).toBe(false);
  });

  it("is false when only importantNotes has an entry", () => {
    expect(isMedicalProfileEmpty(makeProfile({ importantNotes: ["Note."] }))).toBe(false);
  });
});
