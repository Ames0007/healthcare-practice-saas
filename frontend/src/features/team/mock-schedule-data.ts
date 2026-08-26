import type { WorkInterval, Weekday } from "@/components/domain/team/types";

type DayPattern = readonly (readonly [Weekday, string, string])[];

/** Local fixture-authoring helper only — expands a literal per-weekday time list into full `WorkInterval` rows. */
function buildWeek(teamMemberId: string, pattern: DayPattern): WorkInterval[] {
  return pattern.map(([weekday, startTime, endTime], index) => ({
    id: `wi-${teamMemberId}-${index + 1}`,
    teamMemberId,
    weekday,
    startTime,
    endTime,
    active: true,
  }));
}

const SPLIT_SHIFT_MON_FRI_SAT = (
  morningStart: string,
  morningEnd: string,
  afternoonStart: string,
  afternoonEnd: string,
): DayPattern => [
  ["monday", morningStart, morningEnd],
  ["monday", afternoonStart, afternoonEnd],
  ["tuesday", morningStart, morningEnd],
  ["tuesday", afternoonStart, afternoonEnd],
  ["wednesday", morningStart, morningEnd],
  ["wednesday", afternoonStart, afternoonEnd],
  ["thursday", morningStart, morningEnd],
  ["thursday", afternoonStart, afternoonEnd],
  ["friday", morningStart, morningEnd],
  ["friday", afternoonStart, afternoonEnd],
  ["saturday", morningStart, morningEnd],
];

const SINGLE_INTERVAL_MON_FRI = (startTime: string, endTime: string): DayPattern => [
  ["monday", startTime, endTime],
  ["tuesday", startTime, endTime],
  ["wednesday", startTime, endTime],
  ["thursday", startTime, endTime],
  ["friday", startTime, endTime],
];

/**
 * Centralized synthetic work-interval fixtures (UI-007B §5-7). Dr. Benali
 * and Dr. Amal (team-1/2) each have a split shift (morning + afternoon,
 * lunch break in between) plus a shorter Saturday morning — demonstrating
 * §7's "multiple work intervals per day" on a realistic cabinet pattern.
 * Meryem/Nawal/Hamza/Ilham (team-3/4/5/8) each have a single interval per
 * weekday — the simple case. team-6/7 (inactive, or no contract at all)
 * deliberately have no intervals — the "no schedule" empty state.
 * Every member's total (`computeWeeklyScheduledHours`) matches their own
 * contract's `weeklyHours` exactly (`mock-schedule-data.test.ts`).
 */
export function getWorkIntervalsMockData(): WorkInterval[] {
  return [
    ...buildWeek("team-1", SPLIT_SHIFT_MON_FRI_SAT("08:30", "12:30", "14:30", "18:30")),
    ...buildWeek("team-2", SPLIT_SHIFT_MON_FRI_SAT("09:00", "13:00", "15:00", "19:00")),
    ...buildWeek("team-3", SINGLE_INTERVAL_MON_FRI("08:00", "16:00")),
    ...buildWeek("team-4", SINGLE_INTERVAL_MON_FRI("09:00", "14:00")),
    ...buildWeek("team-5", SINGLE_INTERVAL_MON_FRI("08:30", "16:30")),
    ...buildWeek("team-8", SINGLE_INTERVAL_MON_FRI("09:00", "16:00")),
    // team-6 and team-7 deliberately have no intervals.
  ];
}
