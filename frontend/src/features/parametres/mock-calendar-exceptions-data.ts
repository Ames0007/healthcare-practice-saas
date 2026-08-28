import type { CabinetCalendarException } from "@/components/domain/settings/types";
import { addDaysIso } from "@/features/agenda/format";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";

/**
 * Centralized synthetic cabinet calendar exceptions (UI-AGENDA-X). Every
 * conflict-relevant fixture reuses Agenda's own real `getAgendaMockAppointments()`
 * dates/times rather than an independently invented count (CLAUDE.md §12,
 * task §23's own "do not invent" discipline) — see
 * `cross-calendar-exceptions-integrity.test.ts` for the reconciliation
 * proof. Covers all 5 exception types and both the past-history (read-
 * only) and future (editable) lifecycle branches.
 */
export function getCabinetCalendarExceptionsMockData(): CabinetCalendarException[] {
  return [
    {
      id: "cal-exc-1",
      // Real Moroccan public holiday (Fête du Trône), before MOCK_BUSINESS_DATE — past, read-only history.
      date: "2026-07-30",
      type: "public_holiday",
      reason: "Fête du Trône",
      intervals: [],
      createdAt: "2026-07-01",
      active: true,
    },
    {
      id: "cal-exc-2",
      // Real Moroccan public holiday (Marche Verte / Green March), after MOCK_BUSINESS_DATE — future, editable.
      date: "2026-11-06",
      type: "public_holiday",
      reason: "Marche Verte",
      intervals: [],
      createdAt: "2026-08-01",
      active: true,
    },
    {
      id: "cal-exc-3",
      // MOCK_BUSINESS_DATE + 3 = the same date Agenda's own real apt-14 (16:00, non-terminal "requested") already occupies.
      date: addDaysIso(MOCK_BUSINESS_DATE, 3),
      type: "exceptional_closure",
      reason: "Formation de l'équipe",
      intervals: [],
      createdAt: MOCK_BUSINESS_DATE,
      active: true,
    },
    {
      id: "cal-exc-4",
      // MOCK_BUSINESS_DATE + 1 = the same date Agenda's own real apt-12 (09:30) and apt-13 (11:00) already occupy — both fall outside the reduced afternoon-only window.
      date: addDaysIso(MOCK_BUSINESS_DATE, 1),
      type: "modified_hours",
      reason: "Réunion d'équipe le matin",
      intervals: [{ startTime: "13:00", endTime: "18:00" }],
      createdAt: MOCK_BUSINESS_DATE,
      active: true,
    },
    {
      id: "cal-exc-5",
      // A normally-closed Sunday (weekly schedule has no Sunday hours) opened exceptionally — no real appointment exists here, so no conflict to demonstrate.
      date: addDaysIso(MOCK_BUSINESS_DATE, 7),
      type: "exceptional_opening",
      reason: "Journée portes ouvertes",
      intervals: [{ startTime: "09:00", endTime: "13:00" }],
      createdAt: MOCK_BUSINESS_DATE,
      active: true,
    },
    {
      id: "cal-exc-6",
      // A one-off rest day on an otherwise-open weekday, distinct from the recurring weekly Sunday closure — no real appointment exists here.
      date: addDaysIso(MOCK_BUSINESS_DATE, 10),
      type: "rest_day",
      reason: "Repos exceptionnel",
      intervals: [],
      createdAt: MOCK_BUSINESS_DATE,
      active: true,
    },
  ];
}
