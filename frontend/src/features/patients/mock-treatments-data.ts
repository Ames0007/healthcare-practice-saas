import type { TreatmentPlan, TreatmentSession, TreatmentSessionStatus } from "@/components/domain/treatments/types";

function buildSession(
  planId: string,
  sequenceNumber: number,
  overrides: Partial<Omit<TreatmentSession, "id" | "treatmentPlanId" | "sequenceNumber">> & { status?: TreatmentSessionStatus } = {},
): TreatmentSession {
  return {
    id: `${planId}-s${sequenceNumber}`,
    treatmentPlanId: planId,
    sequenceNumber,
    status: "unscheduled",
    ...overrides,
  };
}

const GENOU_PLAN_ID = "tp-1";

const GENOU_COMPLETED_DATES = [
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
  "2026-08-15",
  "2026-08-17",
  "2026-08-18",
  "2026-08-19",
  "2026-08-20",
  "2026-08-21",
  "2026-08-22",
];

/** pat-1 / Ahmed — active 20-session plan: 12 completed, 1 scheduled (matches the Aperçu overview's next appointment, Spec #9 Screen 17/22), 7 unscheduled. */
const genouSessions: TreatmentSession[] = [
  ...GENOU_COMPLETED_DATES.map((date, index) =>
    buildSession(GENOU_PLAN_ID, index + 1, {
      status: "completed",
      scheduledDate: date,
      scheduledTime: "15:00",
      completedAt: date,
      practitionerName: "Dr. Benali",
      appointmentId: `RDV-2026-${1000 + index}`,
    }),
  ),
  buildSession(GENOU_PLAN_ID, 13, {
    status: "scheduled",
    scheduledDate: "2026-08-26",
    scheduledTime: "15:00",
    practitionerName: "Dr. Benali",
  }),
  ...Array.from({ length: 7 }, (_, index) => buildSession(GENOU_PLAN_ID, 14 + index)),
];

const EPAULE_PLAN_ID = "tp-2";

/** pat-3 / Fatima — a fully completed 10-session plan (no active treatment for this patient). */
const epauleSessions: TreatmentSession[] = Array.from({ length: 10 }, (_, index) =>
  buildSession(EPAULE_PLAN_ID, index + 1, {
    status: "completed",
    scheduledDate: `2026-07-${String(index + 1).padStart(2, "0")}`,
    scheduledTime: "10:00",
    completedAt: `2026-07-${String(index + 1).padStart(2, "0")}`,
    practitionerName: "Dr. Amal",
    appointmentId: `RDV-2026-${2000 + index}`,
  }),
);

/**
 * Centralized synthetic treatment-plan fixtures (UI-004C §10-11) — no
 * clinical notes, no financial totals. pat-2/Sara deliberately has no
 * entry here at all (fully-empty state, §31); only active/completed
 * statuses are seeded, since the two-section wireframe (§12) has no slot
 * for paused/cancelled and this task's own guidance is not to invent
 * statuses beyond what's needed.
 */
export function getTreatmentPlansMockData(): TreatmentPlan[] {
  return [
    {
      id: GENOU_PLAN_ID,
      patientId: "pat-1",
      title: "Rééducation genou",
      practitionerId: "pr-1",
      practitionerName: "Dr. Benali",
      startDate: "2026-08-10",
      plannedSessions: 20,
      status: "active",
      sessions: genouSessions,
    },
    {
      id: EPAULE_PLAN_ID,
      patientId: "pat-3",
      title: "Rééducation épaule",
      practitionerId: "pr-2",
      practitionerName: "Dr. Amal",
      startDate: "2026-07-01",
      plannedSessions: 10,
      status: "completed",
      completedDate: "2026-07-15",
      sessions: epauleSessions,
    },
  ];
}

export function getEmptyTreatmentPlansMockData(): TreatmentPlan[] {
  return [];
}
