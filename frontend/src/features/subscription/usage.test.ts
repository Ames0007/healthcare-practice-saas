import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { countActivePractitioners, countActiveStaff } from "./usage";

describe("usage", () => {
  it("countActivePractitioners counts only active practitioner-role members (Youssef Benali, Amal Idrissi — Othmane Zouiten is inactive)", () => {
    expect(countActivePractitioners(getTeamMembersMockData())).toBe(2);
  });

  it("countActiveStaff counts every active non-practitioner member (Meryem, Nawal, Hamza, Ilham — Khadija is inactive)", () => {
    expect(countActiveStaff(getTeamMembersMockData())).toBe(4);
  });

  it("both counts are zero for an empty roster", () => {
    expect(countActivePractitioners([])).toBe(0);
    expect(countActiveStaff([])).toBe(0);
  });
});
