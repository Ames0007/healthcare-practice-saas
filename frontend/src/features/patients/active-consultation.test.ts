import { describe, expect, it } from "vitest";
import type { ActiveConsultation } from "@/components/domain/clinical/types";
import {
  getActiveConsultationById,
  isConsultationCompletionValid,
  isConsultationDirty,
  toClinicalEncounter,
} from "./active-consultation";

function makeConsultation(overrides: Partial<ActiveConsultation> = {}): ActiveConsultation {
  return {
    id: "cons-x",
    patientId: "pat-1",
    practitionerId: "pr-1",
    practitionerName: "Dr. Test",
    date: "2026-08-23",
    time: "10:00",
    status: "draft",
    reason: "Motif test",
    observations: "Obs",
    assessment: "Eval",
    plan: "Plan",
    ...overrides,
  };
}

describe("getActiveConsultationById", () => {
  it("finds a consultation by id", () => {
    const consultations = [makeConsultation({ id: "a" }), makeConsultation({ id: "b" })];
    expect(getActiveConsultationById(consultations, "b")?.id).toBe("b");
  });

  it("returns null when no consultation matches", () => {
    expect(getActiveConsultationById([makeConsultation({ id: "a" })], "missing")).toBeNull();
  });
});

describe("isConsultationCompletionValid", () => {
  it("is invalid when reason is empty", () => {
    expect(isConsultationCompletionValid(makeConsultation({ reason: "" }))).toBe(false);
  });

  it("is invalid when reason is only whitespace", () => {
    expect(isConsultationCompletionValid(makeConsultation({ reason: "   " }))).toBe(false);
  });

  it("is valid when reason has content", () => {
    expect(isConsultationCompletionValid(makeConsultation({ reason: "Douleur au genou" }))).toBe(true);
  });
});

describe("isConsultationDirty", () => {
  it("is not dirty when identical to the saved snapshot", () => {
    const consultation = makeConsultation();
    expect(isConsultationDirty(consultation, { ...consultation })).toBe(false);
  });

  it("is dirty when reason differs", () => {
    const saved = makeConsultation();
    const current = { ...saved, reason: "Nouveau motif" };
    expect(isConsultationDirty(current, saved)).toBe(true);
  });

  it("is dirty when observations/assessment/plan differ", () => {
    const saved = makeConsultation();
    expect(isConsultationDirty({ ...saved, observations: "Changed" }, saved)).toBe(true);
    expect(isConsultationDirty({ ...saved, assessment: "Changed" }, saved)).toBe(true);
    expect(isConsultationDirty({ ...saved, plan: "Changed" }, saved)).toBe(true);
  });

  it("treats an unset optional field the same as an empty string", () => {
    const saved = makeConsultation({ observations: undefined });
    const current = makeConsultation({ observations: "" });
    expect(isConsultationDirty(current, saved)).toBe(false);
  });

  it("ignores status/completedAt differences", () => {
    const saved = makeConsultation({ status: "draft" });
    const current = makeConsultation({ status: "completed", completedAt: "2026-08-23" });
    expect(isConsultationDirty(current, saved)).toBe(false);
  });
});

describe("toClinicalEncounter", () => {
  it("transforms a completed consultation into a valid ClinicalEncounter with matching fields", () => {
    const consultation = makeConsultation({
      id: "cons-9",
      patientId: "pat-4",
      practitionerId: "pr-2",
      practitionerName: "Dr. Amal",
      appointmentId: "RDV-2026-9999",
      date: "2026-08-20",
      time: "09:30",
      status: "completed",
      reason: "Contrôle dentaire",
      observations: "RAS",
      assessment: "Bonne hygiène",
      plan: "Contrôle dans 6 mois",
      completedAt: "2026-08-20",
    });

    const encounter = toClinicalEncounter(consultation);

    expect(encounter).toMatchObject({
      id: "cons-9",
      patientId: "pat-4",
      encounterType: "consultation",
      date: "2026-08-20",
      time: "09:30",
      practitionerId: "pr-2",
      practitionerName: "Dr. Amal",
      appointmentId: "RDV-2026-9999",
      status: "completed",
      reason: "Contrôle dentaire",
      observations: "RAS",
      assessment: "Bonne hygiène",
      plan: "Contrôle dans 6 mois",
    });
  });

  it("carries an unset appointmentId through as undefined, never inventing one", () => {
    const consultation = makeConsultation({ appointmentId: undefined });
    expect(toClinicalEncounter(consultation).appointmentId).toBeUndefined();
  });
});
