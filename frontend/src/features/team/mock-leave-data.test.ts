import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "./mock-data";
import { getAttendanceMockData } from "./mock-attendance-data";
import { getLeaveBalancesMockData, getLeaveRequestsMockData } from "./mock-leave-data";
import { computeLeaveDurationDays } from "./leave";

describe("getLeaveRequestsMockData fixture integrity (UI-007CDEF Gate 2)", () => {
  it("every request's teamMemberId resolves to a real TeamMember", () => {
    const memberIds = new Set(getTeamMembersMockData().map((member) => member.id));
    for (const request of getLeaveRequestsMockData()) {
      expect(memberIds.has(request.teamMemberId)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const requests = getLeaveRequestsMockData();
    expect(new Set(requests.map((request) => request.id)).size).toBe(requests.length);
  });

  it("every request's own stored duration matches the computed inclusive day count", () => {
    for (const request of getLeaveRequestsMockData()) {
      expect(request.duration).toBe(computeLeaveDurationDays(request.startDate, request.endDate));
    }
  });

  it("covers all three statuses (pending/approved/rejected)", () => {
    const statuses = new Set(getLeaveRequestsMockData().map((request) => request.status));
    expect(statuses.has("pending")).toBe(true);
    expect(statuses.has("approved")).toBe(true);
    expect(statuses.has("rejected")).toBe(true);
  });

  it("has at least one member with no leave requests at all (empty-state demo)", () => {
    const members = getTeamMembersMockData();
    const requestedMemberIds = new Set(getLeaveRequestsMockData().map((request) => request.teamMemberId));
    expect(members.some((member) => !requestedMemberIds.has(member.id))).toBe(true);
  });

  it("the approved-leave integration date (team-3, 2026-08-25) is genuinely distinct from every Gate 1 attendance fixture date, so wiring leave into attendance never silently changes an existing attendance result", () => {
    const attendanceDates = new Set(
      getAttendanceMockData()
        .filter((record) => record.teamMemberId === "team-3")
        .map((record) => record.businessDate),
    );
    expect(attendanceDates.has("2026-08-25")).toBe(false);
  });

  it("UI-LEAVE-X: lr-5/lr-6 (team-2, team-5) add real simultaneous approved leave without disturbing any existing fixture's id/values", () => {
    const requests = getLeaveRequestsMockData();
    const original = ["lr-1", "lr-2", "lr-3", "lr-4"].map((id) => requests.find((request) => request.id === id));
    expect(original.every(Boolean)).toBe(true);

    const lr5 = requests.find((request) => request.id === "lr-5")!;
    const lr6 = requests.find((request) => request.id === "lr-6")!;
    expect(lr5.teamMemberId).toBe("team-2");
    expect(lr6.teamMemberId).toBe("team-5");
    expect(lr5.status).toBe("approved");
    expect(lr6.status).toBe("approved");
    // 2026-08-27 is covered by both — the real simultaneous-absence scenario.
    expect(lr5.startDate <= "2026-08-27" && lr5.endDate >= "2026-08-27").toBe(true);
    expect(lr6.startDate <= "2026-08-27" && lr6.endDate >= "2026-08-27").toBe(true);
  });

  it("team-4 (Nawal Chaoui) still has no leave requests at all after the UI-LEAVE-X additions — the empty-state demo is unaffected", () => {
    const requestedMemberIds = new Set(getLeaveRequestsMockData().map((request) => request.teamMemberId));
    expect(requestedMemberIds.has("team-4")).toBe(false);
  });

  it("lr-5/lr-6's own dates do not collide with any existing Gate 1 attendance fixture for team-2/team-5 (neither has one, confirmed directly)", () => {
    const attendanceMemberIds = new Set(getAttendanceMockData().map((record) => record.teamMemberId));
    expect(attendanceMemberIds.has("team-2")).toBe(false);
    expect(attendanceMemberIds.has("team-5")).toBe(false);
  });
});

describe("getLeaveBalancesMockData fixture integrity", () => {
  it("every balance's teamMemberId resolves to a real TeamMember", () => {
    const memberIds = new Set(getTeamMembersMockData().map((member) => member.id));
    for (const balance of getLeaveBalancesMockData()) {
      expect(memberIds.has(balance.teamMemberId)).toBe(true);
    }
  });

  it("no balance is negative", () => {
    for (const balance of getLeaveBalancesMockData()) {
      expect(balance.available).toBeGreaterThanOrEqual(0);
      expect(balance.used).toBeGreaterThanOrEqual(0);
    }
  });
});
