import type { Weekday, WorkDayFormValues, WorkInterval, WorkWeekFormValues } from "@/components/domain/team/types";
import { parseTimeToMinutes } from "@/features/agenda/format";

export const WEEKDAY_ORDER: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function getIntervalsForMember(intervals: WorkInterval[], teamMemberId: string): WorkInterval[] {
  return intervals.filter((interval) => interval.teamMemberId === teamMemberId && interval.active);
}

/** Groups a member's own intervals by weekday, each day's own intervals ordered earliest-first (for a split-shift day). */
export function groupIntervalsByWeekday(intervals: WorkInterval[]): Record<Weekday, WorkInterval[]> {
  const grouped = Object.fromEntries(WEEKDAY_ORDER.map((weekday) => [weekday, [] as WorkInterval[]])) as Record<
    Weekday,
    WorkInterval[]
  >;

  for (const interval of intervals) {
    grouped[interval.weekday].push(interval);
  }

  for (const weekday of WEEKDAY_ORDER) {
    grouped[weekday].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }

  return grouped;
}

/** Sum of every interval's own duration, in hours (UI-007B §5/§19) — never used to derive pay. */
export function computeWeeklyScheduledHours(intervals: WorkInterval[]): number {
  const totalMinutes = intervals.reduce(
    (sum, interval) => sum + (parseTimeToMinutes(interval.endTime) - parseTimeToMinutes(interval.startTime)),
    0,
  );
  return totalMinutes / 60;
}

/** An interval's end must be strictly after its start — no overnight/cross-midnight intervals in this prototype. */
export function isValidWorkInterval(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  return parseTimeToMinutes(endTime) > parseTimeToMinutes(startTime);
}

/** Two same-day intervals must not overlap — the second must start at or after the first ends. */
export function intervalsAreSequential(firstEnd: string, secondStart: string): boolean {
  return parseTimeToMinutes(secondStart) >= parseTimeToMinutes(firstEnd);
}

const EMPTY_DAY: WorkDayFormValues = {
  worked: false,
  interval1Start: "",
  interval1End: "",
  hasSecondInterval: false,
  interval2Start: "",
  interval2End: "",
};

/** Builds the schedule editor's initial per-weekday form state from a member's own current intervals (UI-007B §9). */
export function buildInitialWorkWeekFormValues(intervals: WorkInterval[]): WorkWeekFormValues {
  const grouped = groupIntervalsByWeekday(intervals);

  return Object.fromEntries(
    WEEKDAY_ORDER.map((weekday): [Weekday, WorkDayFormValues] => {
      const dayIntervals = grouped[weekday];
      if (dayIntervals.length === 0) {
        return [weekday, EMPTY_DAY];
      }

      const [first, second] = dayIntervals;
      return [
        weekday,
        {
          worked: true,
          interval1Start: first.startTime,
          interval1End: first.endTime,
          hasSecondInterval: Boolean(second),
          interval2Start: second?.startTime ?? "",
          interval2End: second?.endTime ?? "",
        },
      ];
    }),
  ) as WorkWeekFormValues;
}

/** Rebuilds a member's full interval set from the editor's validated form state (UI-007B §9) — a full replacement, not a merge. */
export function buildIntervalsFromWorkWeekFormValues(teamMemberId: string, values: WorkWeekFormValues): WorkInterval[] {
  const intervals: WorkInterval[] = [];

  for (const weekday of WEEKDAY_ORDER) {
    const day = values[weekday];
    if (!day.worked) continue;

    intervals.push({
      id: `wi-${teamMemberId}-${weekday}-1`,
      teamMemberId,
      weekday,
      startTime: day.interval1Start,
      endTime: day.interval1End,
      active: true,
    });

    if (day.hasSecondInterval) {
      intervals.push({
        id: `wi-${teamMemberId}-${weekday}-2`,
        teamMemberId,
        weekday,
        startTime: day.interval2Start,
        endTime: day.interval2End,
        active: true,
      });
    }
  }

  return intervals;
}
