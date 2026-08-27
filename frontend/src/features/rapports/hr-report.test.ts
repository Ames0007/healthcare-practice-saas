import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getAttendanceMockData } from "@/features/team/mock-attendance-data";
import { getWorkIntervalsMockData } from "@/features/team/mock-schedule-data";
import { computeHrReportKpis } from "./hr-report";

/**
 * "week" resolves to 2026-08-17..2026-08-23 (Monday of the week containing
 * MOCK_BUSINESS_DATE, a Sunday) — exactly bounds every fixture attendance
 * record (2026-08-17..2026-08-22).
 */
describe("computeHrReportKpis (real fixtures, week of 2026-08-17)", () => {
  const range = getPeriodRange("week", MOCK_BUSINESS_DATE);
  const kpis = computeHrReportKpis(getTeamMembersMockData(), getAttendanceMockData(), getWorkIntervalsMockData(), range);

  it("6 active team members (team-1..5, team-8 — team-6/7 are inactive)", () => {
    expect(kpis.activeHeadcount).toBe(6);
  });

  it("3 late arrivals across the week (team-1: 08-18 + 08-22; team-3: 08-18)", () => {
    expect(kpis.lateCount).toBe(3);
  });

  it("worked hours sum to 68.1h (team-1: 480+465+495+480+235=2155min; team-3: 480+468+465+515=1928min; total 4083min)", () => {
    expect(kpis.workedHours).toBeCloseTo(68.1, 5);
  });

  it("overtime hours sum to 0.8h (team-1: 15min on 08-19; team-3: 35min on 08-20; total 50min)", () => {
    expect(kpis.overtimeHours).toBeCloseTo(0.8, 5);
  });

  it("returns zeroed activity figures for a period with no attendance records, headcount unaffected", () => {
    const farRange = getPeriodRange("today", "2026-01-01");
    const empty = computeHrReportKpis(getTeamMembersMockData(), getAttendanceMockData(), getWorkIntervalsMockData(), farRange);
    expect(empty.workedHours).toBe(0);
    expect(empty.lateCount).toBe(0);
    expect(empty.overtimeHours).toBe(0);
    expect(empty.activeHeadcount).toBe(6);
  });
});
