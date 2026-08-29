import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "./mock-data";
import { getLeaveRequestsMockData } from "./mock-leave-data";
import { getCabinetWorkingHoursMockData } from "@/features/parametres/mock-cabinet-working-hours-data";
import { getCabinetCalendarExceptionsMockData } from "@/features/parametres/mock-calendar-exceptions-data";
import {
  buildLeaveCalendarEvents,
  buildLeaveCalendarMonth,
  buildMonthGridDates,
  countApprovedLeaveTouchingMonth,
  countApprovedPractitionersAway,
  countPendingRequests,
  doesEventCoverDate,
  formatEventDateRange,
  getApprovedTeamMembersAway,
  getCabinetClosureForDate,
  getEventsForDate,
  getMonthEndIso,
  getMonthStartIso,
  groupLeaveEventsByMonth,
  resolveStatusFilterValues,
  shiftMonthIso,
  type LeaveCalendarEvent,
} from "./leave-calendar";

const members = getTeamMembersMockData();
const requests = getLeaveRequestsMockData();
const events = buildLeaveCalendarEvents(requests, members);
const workingHours = getCabinetWorkingHoursMockData();
const exceptions = getCabinetCalendarExceptionsMockData();

describe("buildLeaveCalendarEvents — projection (task §4/§5/§39)", () => {
  it("every event's own teamMemberId resolves to a real TeamMember", () => {
    const memberIds = new Set(members.map((member) => member.id));
    for (const event of events) {
      expect(memberIds.has(event.teamMemberId)).toBe(true);
    }
  });

  it("every event's leaveRequestId resolves to a real LeaveRequest with identical dates/type/status/duration", () => {
    const requestById = new Map(requests.map((request) => [request.id, request]));
    for (const event of events) {
      const request = requestById.get(event.leaveRequestId)!;
      expect(request).toBeDefined();
      expect(event.startDate).toBe(request.startDate);
      expect(event.endDate).toBe(request.endDate);
      expect(event.leaveType).toBe(request.leaveType);
      expect(event.status).toBe(request.status);
      expect(event.duration).toBe(request.duration);
    }
  });

  it("produces exactly one event per LeaveRequest — never a second, independently-invented count", () => {
    expect(events).toHaveLength(requests.length);
  });

  it("does not mutate the source LeaveRequest[]/TeamMember[] arrays", () => {
    const requestsSnapshot = JSON.parse(JSON.stringify(requests));
    const membersSnapshot = JSON.parse(JSON.stringify(members));
    buildLeaveCalendarEvents(requests, members);
    expect(requests).toEqual(requestsSnapshot);
    expect(members).toEqual(membersSnapshot);
  });

  it("skips a request whose teamMemberId does not resolve, rather than throwing", () => {
    const orphan = { ...requests[0], id: "lr-orphan", teamMemberId: "does-not-exist" };
    const result = buildLeaveCalendarEvents([orphan], members);
    expect(result).toHaveLength(0);
  });

  it("marks isPractitioner from TeamRole, not from the narrower Agenda practitionerId link (task §24)", () => {
    const amalEvent = events.find((event) => event.teamMemberId === "team-2")!;
    expect(amalEvent.isPractitioner).toBe(true);
    const hamzaEvent = events.find((event) => event.teamMemberId === "team-5")!;
    expect(hamzaEvent.isPractitioner).toBe(false);
  });
});

describe("doesEventCoverDate / getEventsForDate — multi-day projection (task §8/§9)", () => {
  const multiDay: LeaveCalendarEvent = {
    leaveRequestId: "lr-5",
    teamMemberId: "team-2",
    employeeName: "Amal Idrissi",
    employeeNumber: "EMP-0002",
    isPractitioner: true,
    leaveType: "annual",
    startDate: "2026-08-26",
    endDate: "2026-08-28",
    duration: 3,
    status: "approved",
  };

  it("covers every date within the inclusive range, not only the start date", () => {
    expect(doesEventCoverDate(multiDay, "2026-08-26")).toBe(true);
    expect(doesEventCoverDate(multiDay, "2026-08-27")).toBe(true);
    expect(doesEventCoverDate(multiDay, "2026-08-28")).toBe(true);
  });

  it("does not cover the day immediately before start or immediately after end", () => {
    expect(doesEventCoverDate(multiDay, "2026-08-25")).toBe(false);
    expect(doesEventCoverDate(multiDay, "2026-08-29")).toBe(false);
  });

  it("real fixture: Amal Idrissi's 3-day leave appears on all 3 dates via getEventsForDate", () => {
    expect(getEventsForDate(events, "2026-08-26").some((event) => event.teamMemberId === "team-2")).toBe(true);
    expect(getEventsForDate(events, "2026-08-27").some((event) => event.teamMemberId === "team-2")).toBe(true);
    expect(getEventsForDate(events, "2026-08-28").some((event) => event.teamMemberId === "team-2")).toBe(true);
    expect(getEventsForDate(events, "2026-08-29").some((event) => event.teamMemberId === "team-2")).toBe(false);
  });

  it("status filter narrows the result to only the requested statuses", () => {
    const pendingOnly = getEventsForDate(events, "2026-09-04", ["pending"]);
    expect(pendingOnly).toHaveLength(1);
    expect(pendingOnly[0].status).toBe("pending");

    expect(getEventsForDate(events, "2026-09-04", ["approved"])).toHaveLength(0);
  });
});

describe("Approved-away / practitioner-overlap derivation (task §17/§18/§22/§24, real fixtures)", () => {
  it("2026-08-27: Amal Idrissi and Hamza Rifai are simultaneously on approved leave — 2 away, 1 practitioner", () => {
    const away = getApprovedTeamMembersAway(events, "2026-08-27");
    expect(away.map((event) => event.teamMemberId).sort()).toEqual(["team-2", "team-5"]);
    expect(countApprovedPractitionersAway(events, "2026-08-27")).toBe(1);
  });

  it("a pending request never counts as confirmed absence (2026-09-04, Meryem Bakkali pending)", () => {
    expect(getApprovedTeamMembersAway(events, "2026-09-04")).toHaveLength(0);
  });

  it("a rejected request never counts as confirmed absence (2026-07-01/02, Meryem Bakkali rejected)", () => {
    expect(getApprovedTeamMembersAway(events, "2026-07-01")).toHaveLength(0);
  });

  it("an approved request does count (2026-08-25, Meryem Bakkali approved)", () => {
    const away = getApprovedTeamMembersAway(events, "2026-08-25");
    expect(away).toHaveLength(1);
    expect(away[0].teamMemberId).toBe("team-3");
  });

  it("a date with no leave at all has zero away members and zero practitioners away", () => {
    expect(getApprovedTeamMembersAway(events, "2026-08-01")).toHaveLength(0);
    expect(countApprovedPractitionersAway(events, "2026-08-01")).toBe(0);
  });
});

describe("resolveStatusFilterValues (task §16 — restrained operational default)", () => {
  it("'operational' resolves to approved+pending, excluding rejected", () => {
    expect(resolveStatusFilterValues("operational")).toEqual(["approved", "pending"]);
  });

  it("each granular value resolves to exactly itself", () => {
    expect(resolveStatusFilterValues("approved")).toEqual(["approved"]);
    expect(resolveStatusFilterValues("pending")).toEqual(["pending"]);
    expect(resolveStatusFilterValues("rejected")).toEqual(["rejected"]);
  });

  it("'all' resolves to undefined (no filtering)", () => {
    expect(resolveStatusFilterValues("all")).toBeUndefined();
  });
});

describe("Month grid (task §8/§10/§13)", () => {
  it("buildMonthGridDates always returns 42 dates starting on a Monday", () => {
    const dates = buildMonthGridDates("2026-09-01");
    expect(dates).toHaveLength(42);
    expect(new Date(`${dates[0]}T00:00:00Z`).getUTCDay()).toBe(1);
  });

  it("a multi-day event's own grid cells all carry it — never only its start date's cell", () => {
    const month = buildLeaveCalendarMonth("2026-08-01", events);
    const daysWithAmal = month.filter((day) => day.events.some((event) => event.teamMemberId === "team-2"));
    expect(daysWithAmal.map((day) => day.date)).toEqual(["2026-08-26", "2026-08-27", "2026-08-28"]);
  });

  it("marks isCurrentMonth correctly for leading/trailing days from adjacent months", () => {
    const month = buildLeaveCalendarMonth("2026-08-01", events);
    expect(month.every((day) => day.date.slice(0, 7) === "2026-08" ? day.isCurrentMonth : !day.isCurrentMonth)).toBe(true);
  });

  it("does not mutate the events array passed in", () => {
    const snapshot = JSON.parse(JSON.stringify(events));
    buildLeaveCalendarMonth("2026-08-01", events);
    expect(events).toEqual(snapshot);
  });

  it("shiftMonthIso/getMonthStartIso handle year rollover deterministically", () => {
    expect(getMonthStartIso("2026-08-23")).toBe("2026-08-01");
    expect(shiftMonthIso("2026-08-01", 1)).toBe("2026-09-01");
    expect(shiftMonthIso("2026-12-01", 1)).toBe("2027-01-01");
    expect(shiftMonthIso("2026-01-01", -1)).toBe("2025-12-01");
  });

  it("getMonthEndIso returns the real last calendar day, including February", () => {
    expect(getMonthEndIso("2026-08-01")).toBe("2026-08-31");
    expect(getMonthEndIso("2026-02-01")).toBe("2026-02-28");
    expect(getMonthEndIso("2028-02-01")).toBe("2028-02-29");
  });
});

describe("countApprovedLeaveTouchingMonth / countPendingRequests (task §30, whole-cabinet dashboard metrics)", () => {
  it("counts real August 2026 approved leave (Meryem 1 day, Amal 3 days, Hamza 1 day) — 3 distinct spans, never a day-count", () => {
    expect(countApprovedLeaveTouchingMonth(events, "2026-08-01")).toBe(3);
  });

  it("a July-only approved span (Dr. Benali) does not count toward August", () => {
    const augustCount = countApprovedLeaveTouchingMonth(events, "2026-08-01");
    const julyCount = countApprovedLeaveTouchingMonth(events, "2026-07-01");
    expect(julyCount).toBe(1);
    expect(augustCount).toBe(3);
  });

  it("pending requests are never included, regardless of month", () => {
    expect(countApprovedLeaveTouchingMonth(events, "2026-09-01")).toBe(0);
  });

  it("countPendingRequests counts the one real pending fixture (Meryem Bakkali)", () => {
    expect(countPendingRequests(events)).toBe(1);
  });
});

describe("groupLeaveEventsByMonth (task §12 — chronological, never fixture insertion order)", () => {
  it("groups are ordered chronologically by start date, not by array order", () => {
    const groups = groupLeaveEventsByMonth(events, "fr");
    const monthKeys = groups.map((group) => group.monthKey);
    expect(monthKeys).toEqual([...monthKeys].sort());
  });

  it("every event appears in exactly one group", () => {
    const groups = groupLeaveEventsByMonth(events, "fr");
    const total = groups.reduce((sum, group) => sum + group.events.length, 0);
    expect(total).toBe(events.length);
  });
});

describe("formatEventDateRange", () => {
  it("a single-day event renders one date", () => {
    const single = events.find((event) => event.teamMemberId === "team-3" && event.status === "approved")!;
    expect(formatEventDateRange(single, "fr")).not.toContain("–");
  });

  it("a multi-day event renders a start–end range", () => {
    const multi = events.find((event) => event.teamMemberId === "team-2")!;
    expect(formatEventDateRange(multi, "fr")).toContain("–");
  });
});

describe("getCabinetClosureForDate (task §26 — Cabinet closure != Employee leave)", () => {
  it("returns closure info for a real cabinet exceptional_closure exception (2026-08-26)", () => {
    const closure = getCabinetClosureForDate("2026-08-26", workingHours, exceptions);
    expect(closure).not.toBeNull();
    expect(closure!.exceptionType).toBe("exceptional_closure");
  });

  it("returns null for a normal open working day", () => {
    expect(getCabinetClosureForDate("2026-08-17", workingHours, exceptions)).toBeNull();
  });

  it("returns null for modified_hours (still open, not a closure)", () => {
    expect(getCabinetClosureForDate("2026-08-24", workingHours, exceptions)).toBeNull();
  });

  it("returns null for an ordinary non-working Sunday from the weekly schedule (never converted into a fabricated closure event, task §26)", () => {
    // 2026-08-16 is a Sunday with no calendar exception of its own.
    expect(getCabinetClosureForDate("2026-08-16", workingHours, exceptions)).toBeNull();
  });

  it("never returns a LeaveCalendarEvent-shaped object — cabinet closure stays a distinct concept from employee leave", () => {
    const closure = getCabinetClosureForDate("2026-08-26", workingHours, exceptions);
    expect(closure).not.toHaveProperty("teamMemberId");
    expect(closure).not.toHaveProperty("leaveRequestId");
  });
});
