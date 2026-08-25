import { describe, expect, it } from "vitest";
import type { ClinicalEncounter } from "@/components/domain/clinical/types";
import {
  getEncountersForPatient,
  groupEncountersByDate,
  matchesClinicalHistoryFilter,
  sortEncountersDesc,
} from "./clinical-history";

function makeEncounter(overrides: Partial<ClinicalEncounter> = {}): ClinicalEncounter {
  return {
    id: "enc-x",
    patientId: "pat-1",
    encounterType: "consultation",
    date: "2026-08-10",
    practitionerId: "pr-1",
    practitionerName: "Dr. Test",
    status: "completed",
    reason: "Motif test",
    ...overrides,
  };
}

describe("getEncountersForPatient", () => {
  it("filters by patientId only", () => {
    const encounters = [makeEncounter({ id: "a", patientId: "pat-1" }), makeEncounter({ id: "b", patientId: "pat-2" })];
    expect(getEncountersForPatient(encounters, "pat-1").map((e) => e.id)).toEqual(["a"]);
  });
});

describe("sortEncountersDesc", () => {
  it("orders newest date first, independent of insertion order", () => {
    const encounters = [
      makeEncounter({ id: "old", date: "2026-07-01" }),
      makeEncounter({ id: "new", date: "2026-08-20" }),
      makeEncounter({ id: "mid", date: "2026-08-01" }),
    ];
    expect(sortEncountersDesc(encounters).map((e) => e.id)).toEqual(["new", "mid", "old"]);
  });

  it("breaks a same-date tie by later time first", () => {
    const encounters = [
      makeEncounter({ id: "morning", date: "2026-08-10", time: "09:00" }),
      makeEncounter({ id: "afternoon", date: "2026-08-10", time: "15:00" }),
    ];
    expect(sortEncountersDesc(encounters).map((e) => e.id)).toEqual(["afternoon", "morning"]);
  });

  it("does not mutate the input array", () => {
    const encounters = [makeEncounter({ id: "a", date: "2026-08-01" }), makeEncounter({ id: "b", date: "2026-08-20" })];
    sortEncountersDesc(encounters);
    expect(encounters.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("matchesClinicalHistoryFilter", () => {
  it("matches everything for 'all'", () => {
    expect(matchesClinicalHistoryFilter(makeEncounter({ encounterType: "consultation" }), "all")).toBe(true);
    expect(matchesClinicalHistoryFilter(makeEncounter({ encounterType: "session" }), "all")).toBe(true);
  });

  it("matches only consultations for 'consultations'", () => {
    expect(matchesClinicalHistoryFilter(makeEncounter({ encounterType: "consultation" }), "consultations")).toBe(true);
    expect(matchesClinicalHistoryFilter(makeEncounter({ encounterType: "session" }), "consultations")).toBe(false);
  });

  it("matches only sessions for 'sessions'", () => {
    expect(matchesClinicalHistoryFilter(makeEncounter({ encounterType: "session" }), "sessions")).toBe(true);
    expect(matchesClinicalHistoryFilter(makeEncounter({ encounterType: "consultation" }), "sessions")).toBe(false);
  });
});

describe("groupEncountersByDate", () => {
  it("clusters consecutive same-date encounters into one group", () => {
    const encounters = [
      makeEncounter({ id: "a", date: "2026-08-23" }),
      makeEncounter({ id: "b", date: "2026-08-23" }),
      makeEncounter({ id: "c", date: "2026-08-18" }),
    ];
    const groups = groupEncountersByDate(encounters);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ date: "2026-08-23", encounters: [{ id: "a" }, { id: "b" }] });
    expect(groups[1]).toMatchObject({ date: "2026-08-18", encounters: [{ id: "c" }] });
  });

  it("returns an empty array for no encounters", () => {
    expect(groupEncountersByDate([])).toEqual([]);
  });
});
