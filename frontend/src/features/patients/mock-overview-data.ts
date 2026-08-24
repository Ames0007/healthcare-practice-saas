import type { PatientOverview } from "@/components/domain/patients/types";

/** Synthetic, keyed by the same `pat-N` ids as `mock-data.ts` — no real patient information. */
const OVERVIEW_BY_PATIENT_ID: Record<string, PatientOverview> = {
  "pat-1": {
    patientId: "pat-1",
    activeTreatment: { name: "Rééducation genou", completedSessions: 12, totalSessions: 20 },
    nextInstallment: { amount: 500, dueDate: "2026-09-01" },
    recentActivity: [
      { id: "act-1", date: "2026-08-23", type: "consultation", translationKey: "patientDetail.activity.consultationCompleted" },
      { id: "act-2", date: "2026-08-23", type: "payment", translationKey: "patientDetail.activity.paymentReceived", amount: 500 },
      { id: "act-3", date: "2026-08-20", type: "document", translationKey: "patientDetail.activity.documentAdded" },
      { id: "act-4", date: "2026-08-18", type: "appointment", translationKey: "patientDetail.activity.appointmentConfirmed" },
      { id: "act-5", date: "2026-08-15", type: "treatment", translationKey: "patientDetail.activity.treatmentSessionCompleted" },
    ],
  },
  "pat-2": {
    patientId: "pat-2",
    activeTreatment: null,
    nextInstallment: null,
    recentActivity: [
      { id: "act-6", date: "2026-08-20", type: "appointment", translationKey: "patientDetail.activity.appointmentConfirmed" },
    ],
  },
};

const EMPTY_OVERVIEW: Omit<PatientOverview, "patientId"> = {
  activeTreatment: null,
  nextInstallment: null,
  recentActivity: [],
};

export function getPatientOverview(patientId: string): PatientOverview {
  return OVERVIEW_BY_PATIENT_ID[patientId] ?? { patientId, ...EMPTY_OVERVIEW };
}
