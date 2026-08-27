import type { CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import { WEEKDAY_ORDER } from "@/features/team/schedule";

/**
 * Centralized synthetic cabinet-wide working hours (UI-010ABC Gate 3,
 * Spec #9 Screen 05's own onboarding worked example: "08:30–18:00, Monday
 * through Saturday, closed Sunday"). One row per `Weekday` — reuses
 * `WEEKDAY_ORDER` from Équipe (`features/team/schedule.ts`) for the same
 * Monday-start ordering, never a second weekday sequence.
 */
export function getCabinetWorkingHoursMockData(): CabinetWorkingHoursDay[] {
  return WEEKDAY_ORDER.map((weekday) =>
    weekday === "sunday"
      ? { weekday, isOpen: false }
      : { weekday, isOpen: true, startTime: "08:30", endTime: "18:00" },
  );
}
