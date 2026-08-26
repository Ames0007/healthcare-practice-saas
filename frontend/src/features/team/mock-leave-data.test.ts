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
