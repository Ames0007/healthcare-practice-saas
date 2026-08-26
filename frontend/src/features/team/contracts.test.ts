import { describe, expect, it } from "vitest";
import type { EmploymentContract } from "@/components/domain/team/types";
import { getContractsForMember, getCurrentContract, isValidContractDateRange, isValidWeeklyHours } from "./contracts";

const active: EmploymentContract = {
  id: "c-active",
  teamMemberId: "m-1",
  contractType: "permanent",
  status: "active",
  startDate: "2024-01-01",
  jobTitle: "Assistant",
};

const endedOlder: EmploymentContract = {
  id: "c-ended-older",
  teamMemberId: "m-1",
  contractType: "fixed_term",
  status: "ended",
  startDate: "2020-01-01",
  endDate: "2021-12-31",
  jobTitle: "Stagiaire",
};

const endedNewer: EmploymentContract = {
  id: "c-ended-newer",
  teamMemberId: "m-1",
  contractType: "fixed_term",
  status: "ended",
  startDate: "2022-01-01",
  endDate: "2023-12-31",
  jobTitle: "Assistant",
};

describe("getContractsForMember", () => {
  it("returns only the given member's own contracts", () => {
    const other: EmploymentContract = { ...active, id: "c-other", teamMemberId: "m-2" };
    expect(getContractsForMember([active, other], "m-1")).toEqual([active]);
  });
});

describe("getCurrentContract", () => {
  it("prefers the active contract over any historical one (§22)", () => {
    expect(getCurrentContract([endedOlder, active, endedNewer], "m-1")).toEqual(active);
  });

  it("falls back to the most recently started historical contract when none is active", () => {
    expect(getCurrentContract([endedOlder, endedNewer], "m-1")).toEqual(endedNewer);
  });

  it("returns null when the member has no contract at all (§21D)", () => {
    expect(getCurrentContract([active], "m-does-not-exist")).toBeNull();
    expect(getCurrentContract([], "m-1")).toBeNull();
  });
});

describe("isValidContractDateRange", () => {
  it("accepts an empty end date (open-ended, §17)", () => {
    expect(isValidContractDateRange("2024-01-01", "")).toBe(true);
  });

  it("accepts an end date strictly after the start date", () => {
    expect(isValidContractDateRange("2024-01-01", "2024-06-01")).toBe(true);
  });

  it("rejects an end date on or before the start date", () => {
    expect(isValidContractDateRange("2024-01-01", "2024-01-01")).toBe(false);
    expect(isValidContractDateRange("2024-06-01", "2024-01-01")).toBe(false);
  });
});

describe("isValidWeeklyHours", () => {
  it("accepts an empty value (optional field)", () => {
    expect(isValidWeeklyHours("")).toBe(true);
  });

  it("accepts a positive whole or decimal number within a plausible week", () => {
    expect(isValidWeeklyHours("40")).toBe(true);
    expect(isValidWeeklyHours("24.5")).toBe(true);
  });

  it("rejects zero, negative, non-numeric or implausibly large values", () => {
    expect(isValidWeeklyHours("0")).toBe(false);
    expect(isValidWeeklyHours("-5")).toBe(false);
    expect(isValidWeeklyHours("abc")).toBe(false);
    expect(isValidWeeklyHours("400")).toBe(false);
  });
});
