import type { CabinetWorkingHoursDay, CabinetWorkingHoursFormDay } from "@/components/domain/settings/types";
import type { Weekday } from "@/components/domain/team/types";
import { isValidWorkInterval, WEEKDAY_ORDER } from "@/features/team/schedule";

export type CabinetWorkingHoursFormValues = Record<Weekday, CabinetWorkingHoursFormDay>;

const DEFAULT_CLOSED_DAY: CabinetWorkingHoursFormDay = { isOpen: false, startTime: "", endTime: "" };

/** Initial edit-form state from the current weekly schedule (UI-010ABC §16) — mirrors `buildInitialWorkWeekFormValues`'s own per-weekday shape. */
export function buildInitialWorkingHoursFormValues(days: CabinetWorkingHoursDay[]): CabinetWorkingHoursFormValues {
  const byWeekday = new Map(days.map((day) => [day.weekday, day]));

  return Object.fromEntries(
    WEEKDAY_ORDER.map((weekday): [Weekday, CabinetWorkingHoursFormDay] => {
      const day = byWeekday.get(weekday);
      if (!day || !day.isOpen) return [weekday, DEFAULT_CLOSED_DAY];
      return [weekday, { isOpen: true, startTime: day.startTime ?? "", endTime: day.endTime ?? "" }];
    }),
  ) as CabinetWorkingHoursFormValues;
}

/** A day open for business must have a valid start < end interval (reuses `isValidWorkInterval`, Équipe's own rule — never a second time-validity check). A closed day is always valid regardless of its (ignored) time fields. */
export function isValidWorkingHoursForm(values: CabinetWorkingHoursFormValues): boolean {
  return WEEKDAY_ORDER.every((weekday) => {
    const day = values[weekday];
    return !day.isOpen || isValidWorkInterval(day.startTime, day.endTime);
  });
}

/** Rebuilds the full weekly schedule from the editor's validated form state (UI-010ABC §16) — a full replacement, mirrors `buildIntervalsFromWorkWeekFormValues`. */
export function buildWorkingHoursFromFormValues(values: CabinetWorkingHoursFormValues): CabinetWorkingHoursDay[] {
  return WEEKDAY_ORDER.map((weekday) => {
    const day = values[weekday];
    if (!day.isOpen) return { weekday, isOpen: false };
    return { weekday, isOpen: true, startTime: day.startTime, endTime: day.endTime };
  });
}
