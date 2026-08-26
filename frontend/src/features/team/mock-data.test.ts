import { describe, expect, it } from "vitest";
import { PRACTITIONERS } from "@/features/agenda/mock-data";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getTeamMemberFullName } from "./format";
import { getEmptyTeamMembersMockData, getTeamMembersMockData } from "./mock-data";

describe("getTeamMembersMockData fixture integrity (UI-007A §16)", () => {
  it("has unique ids and unique employee numbers", () => {
    const members = getTeamMembersMockData();

    expect(new Set(members.map((member) => member.id)).size).toBe(members.length);
    expect(new Set(members.map((member) => member.employeeNumber)).size).toBe(members.length);
  });

  it("every practitionerId resolves to a real, name-consistent entry in Agenda's own PRACTITIONERS fixture", () => {
    const members = getTeamMembersMockData();
    const linked = members.filter((member) => member.practitionerId);

    expect(linked.length).toBeGreaterThan(0);

    for (const member of linked) {
      const practitioner = PRACTITIONERS.find((candidate) => candidate.id === member.practitionerId);
      expect(practitioner).toBeDefined();
      // Agenda's own fixture stores "Dr. <lastName>" / "Dr. <firstName>" — one
      // of those name parts always resolves to this member's own name, so
      // the two representations never contradict each other (§16).
      expect(practitioner!.name.includes(member.firstName) || practitioner!.name.includes(member.lastName)).toBe(true);
    }
  });

  it("represents at least one practitioner, receptionist and assistant, and at least one active and one inactive member (§15)", () => {
    const members = getTeamMembersMockData();
    const roles = new Set(members.map((member) => member.role));
    const statuses = new Set(members.map((member) => member.status));

    expect(roles.has("practitioner")).toBe(true);
    expect(roles.has("receptionist")).toBe(true);
    expect(roles.has("assistant")).toBe(true);
    expect(statuses.has("active")).toBe(true);
    expect(statuses.has("inactive")).toBe(true);
  });

  it("shares no full name with any seeded patient (§15 collision warning)", () => {
    const memberNames = new Set(getTeamMembersMockData().map((member) => getTeamMemberFullName(member)));
    const patientNames = getPatientsMockData().map((patient) => `${patient.firstName} ${patient.lastName}`);

    for (const patientName of patientNames) {
      expect(memberNames.has(patientName)).toBe(false);
    }
  });

  it("small enough that pagination is not needed (§25)", () => {
    expect(getTeamMembersMockData().length).toBeLessThanOrEqual(15);
  });
});

describe("getEmptyTeamMembersMockData", () => {
  it("returns an empty array for the solo empty-state prototype seam (§17)", () => {
    expect(getEmptyTeamMembersMockData()).toEqual([]);
  });
});
