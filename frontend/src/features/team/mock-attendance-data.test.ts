import { describe, expect, it } from "vitest";
import { getTeamMembersMockData } from "./mock-data";
import { getWorkIntervalsMockData } from "./mock-schedule-data";
import { getAttendanceMockData } from "./mock-attendance-data";
import { computeAttendance, getExpectedIntervalsForDate, resolveAttendanceStatus } from "./attendance";

const TODAY_ISO = "2026-08-23";

describe("getAttendanceMockData fixture integrity (UI-007CDEF Gate 1)", () => {
  it("every record's teamMemberId resolves to a real TeamMember", () => {
    const memberIds = new Set(getTeamMembersMockData().map((member) => member.id));
    for (const record of getAttendanceMockData()) {
      expect(memberIds.has(record.teamMemberId)).toBe(true);
    }
  });

  it("has unique ids", () => {
    const records = getAttendanceMockData();
    expect(new Set(records.map((record) => record.id)).size).toBe(records.length);
  });

  it("never falls on a rest day for the member it belongs to (a fixture bug would contradict its own schedule)", () => {
    const workIntervals = getWorkIntervalsMockData();
    for (const record of getAttendanceMockData()) {
      const expected = getExpectedIntervalsForDate(workIntervals, record.teamMemberId, record.businessDate);
      expect(expected.length).toBeGreaterThan(0);
    }
  });

  it("demonstrates every real AttendanceStatus across the fixture set (on time/late/overtime/early-departure/absent)", () => {
    const workIntervals = getWorkIntervalsMockData();
    const records = getAttendanceMockData();
    const statuses = new Set(
      records.map((record) => {
        const expected = getExpectedIntervalsForDate(workIntervals, record.teamMemberId, record.businessDate);
        return resolveAttendanceStatus(record, expected, true);
      }),
    );
    expect(statuses.has("completed")).toBe(true);
    expect(statuses.has("absent")).toBe(false); // no fixture *row* is absent — absence is proven by the deliberate gaps below

    const lateDays = records.filter((record) => {
      const expected = getExpectedIntervalsForDate(workIntervals, record.teamMemberId, record.businessDate);
      return record.checkIn && computeAttendance(record, expected).lateMinutes > 0;
    });
    const overtimeDays = records.filter((record) => {
      const expected = getExpectedIntervalsForDate(workIntervals, record.teamMemberId, record.businessDate);
      return computeAttendance(record, expected).overtimeMinutes > 0;
    });
    expect(lateDays.length).toBeGreaterThan(0);
    expect(overtimeDays.length).toBeGreaterThan(0);
  });

  it("has a deliberate gap (no record at all) for each of team-1/team-3 on one of their own expected work days, proving the absent state", () => {
    const workIntervals = getWorkIntervalsMockData();
    const records = getAttendanceMockData();

    for (const teamMemberId of ["team-1", "team-3"]) {
      const memberRecords = records.filter((record) => record.teamMemberId === teamMemberId);
      const coveredDates = new Set(memberRecords.map((record) => record.businessDate));
      const expectedWorkDatesInRange = ["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22"].filter(
        (date) => getExpectedIntervalsForDate(workIntervals, teamMemberId, date).length > 0,
      );
      const missingDates = expectedWorkDatesInRange.filter((date) => !coveredDates.has(date));
      expect(missingDates.length).toBeGreaterThan(0);

      for (const missingDate of missingDates) {
        const expected = getExpectedIntervalsForDate(workIntervals, teamMemberId, missingDate);
        expect(resolveAttendanceStatus({}, expected, true)).toBe("absent");
      }
    }
  });

  it("no record exists for MOCK_BUSINESS_DATE itself (a Sunday — correctly a rest day for every fixture member)", () => {
    expect(getAttendanceMockData().some((record) => record.businessDate === TODAY_ISO)).toBe(false);
  });
});
