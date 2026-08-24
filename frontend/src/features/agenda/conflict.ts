import { addMinutesToTime, parseTimeToMinutes } from "./format";
import type { AgendaAppointment, AppointmentDraft } from "./types";

const TERMINAL_STATUSES = new Set(["cancelled_by_patient", "cancelled_by_practice", "no_show", "completed"]);

interface TimeRange {
  start: number;
  end: number;
}

type DraftLike = Pick<
  AppointmentDraft,
  "practitionerId" | "date" | "schedulingType" | "time" | "endTime" | "durationMinutes"
>;

function toRange(input: {
  schedulingType: string;
  time: string;
  endTime?: string;
  durationMinutes?: number;
}): TimeRange {
  const start = parseTimeToMinutes(input.time);
  const end =
    input.schedulingType === "window" && input.endTime
      ? parseTimeToMinutes(input.endTime)
      : start + (input.durationMinutes ?? 30);
  return { start, end };
}

function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Lightweight frontend conflict prototype (§28, Spec #3 WF-69): overlap
 * check for the same practitioner/date. This is UX demonstration only —
 * real overlap policy is a backend/config concern (Spec #3 WF-69 leaves
 * the exact rule as "configured overlap rules").
 */
export function findConflict(existing: AgendaAppointment[], draft: DraftLike, excludeId?: string): AgendaAppointment | null {
  const draftRange = toRange(draft);

  return (
    existing.find((appointment) => {
      if (appointment.id === excludeId) return false;
      if (appointment.practitionerId !== draft.practitionerId || appointment.date !== draft.date) return false;
      if (TERMINAL_STATUSES.has(appointment.status)) return false;
      return overlaps(draftRange, toRange(appointment));
    }) ?? null
  );
}

/** Nearby non-conflicting slot suggestions of the same length as the requested draft. */
export function suggestAlternativeTimes(existing: AgendaAppointment[], draft: DraftLike, count = 3): string[] {
  const draftRange = toRange(draft);
  const durationMinutes = draftRange.end - draftRange.start;
  const suggestions: string[] = [];
  let candidateStart = draftRange.start + 30;

  for (let attempts = 0; attempts < 16 && suggestions.length < count && candidateStart + durationMinutes <= 18 * 60; attempts += 1) {
    const candidateRange: TimeRange = { start: candidateStart, end: candidateStart + durationMinutes };
    const conflict = existing.some((appointment) => {
      if (appointment.practitionerId !== draft.practitionerId || appointment.date !== draft.date) return false;
      if (TERMINAL_STATUSES.has(appointment.status)) return false;
      return overlaps(candidateRange, toRange(appointment));
    });

    if (!conflict) {
      suggestions.push(addMinutesToTime("00:00", candidateStart));
    }

    candidateStart += 30;
  }

  return suggestions;
}
