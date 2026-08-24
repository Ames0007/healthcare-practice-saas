import type { PatientOverview } from "@/components/domain/patients/types";
import { getTreatmentPlansMockData } from "./mock-treatments-data";
import { getActiveTreatmentSummary, getTreatmentPlansForPatient } from "./treatments";

type OverviewFixture = Omit<PatientOverview, "patientId" | "activeTreatment">;

/** Synthetic, keyed by the same `pat-N` ids as `mock-data.ts` — no real patient information. */
const OVERVIEW_BY_PATIENT_ID: Record<string, OverviewFixture> = {
  "pat-1": {
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
    nextInstallment: null,
    recentActivity: [
      { id: "act-6", date: "2026-08-20", type: "appointment", translationKey: "patientDetail.activity.appointmentConfirmed" },
    ],
  },
};

const EMPTY_OVERVIEW: OverviewFixture = {
  nextInstallment: null,
  recentActivity: [],
};

/**
 * `activeTreatment` is derived from the centralized treatment-plan
 * fixtures (`mock-treatments-data.ts`, UI-004C §33) rather than a
 * hand-duplicated number, so the Aperçu overview card and the Treatments
 * tab can never disagree.
 */
export function getPatientOverview(patientId: string): PatientOverview {
  const fixture = OVERVIEW_BY_PATIENT_ID[patientId] ?? EMPTY_OVERVIEW;
  const patientPlans = getTreatmentPlansForPatient(getTreatmentPlansMockData(), patientId);

  return {
    patientId,
    activeTreatment: getActiveTreatmentSummary(patientPlans),
    ...fixture,
  };
}
