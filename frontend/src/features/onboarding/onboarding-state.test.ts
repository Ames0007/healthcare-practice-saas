import { describe, expect, it } from "vitest";
import {
  buildInitialOnboardingCabinetValues,
  buildInitialOnboardingHoursValues,
  buildInitialOnboardingPreferencesValues,
  generateDraftTeamMemberId,
  ONBOARDING_STEP_ORDER,
} from "./onboarding-state";

describe("ONBOARDING_STEP_ORDER", () => {
  it("has exactly 6 steps, never including the terminal complete state", () => {
    expect(ONBOARDING_STEP_ORDER).toHaveLength(6);
    expect(ONBOARDING_STEP_ORDER).not.toContain("complete");
  });
});

describe("buildInitialOnboardingCabinetValues", () => {
  it("starts fully blank except for sensible defaults", () => {
    const values = buildInitialOnboardingCabinetValues();
    expect(values.name).toBe("");
    expect(values.phone).toBe("");
    expect(values.preferredLanguage).toBe("fr");
  });
});

describe("buildInitialOnboardingHoursValues", () => {
  it("every weekday starts closed — never a silently invented default schedule", () => {
    const values = buildInitialOnboardingHoursValues();
    expect(Object.values(values).every((day) => day.isOpen === false)).toBe(true);
  });
});

describe("buildInitialOnboardingPreferencesValues", () => {
  it("has a valid default duration so Continue is never blocked without user action", () => {
    const values = buildInitialOnboardingPreferencesValues();
    expect(Number(values.defaultDurationMinutes)).toBeGreaterThan(0);
  });
});

describe("generateDraftTeamMemberId", () => {
  it("is a pure function of its sequence number, never Math.random", () => {
    expect(generateDraftTeamMemberId(1)).toBe("draft-team-1");
    expect(generateDraftTeamMemberId(1)).toBe("draft-team-1");
    expect(generateDraftTeamMemberId(2)).toBe("draft-team-2");
  });
});
