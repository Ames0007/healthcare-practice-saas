import type { AppointmentSettings } from "@/components/domain/settings/types";

/**
 * Centralized synthetic Rendez-vous defaults (UI-010BC Gate 2). Values are
 * not arbitrary: `defaultSchedulingMode: "exact"` matches the majority
 * scheduling mode among `getCabinetServicesMockData()`'s own five services
 * (4 of 5 are "exact"); `defaultDurationMinutes: 30` matches Consultation's
 * own duration — the cabinet's flagship/first service (Spec #9 Screen 45's
 * worked example) — rather than an unrelated invented number.
 */
export function getAppointmentSettingsMockData(): AppointmentSettings {
  return {
    defaultSchedulingMode: "exact",
    defaultDurationMinutes: 30,
  };
}
