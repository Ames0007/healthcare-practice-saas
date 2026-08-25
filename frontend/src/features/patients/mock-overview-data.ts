import type { PatientOverview } from "@/components/domain/patients/types";
import { getTreatmentPlansMockData } from "./mock-treatments-data";
import { getActiveTreatmentSummary, getTreatmentPlansForPatient } from "./treatments";
import { getInvoicesMockData } from "./mock-invoices-data";
import { getPatientFinancialSummary } from "./finance";

type OverviewFixture = Omit<PatientOverview, "patientId" | "activeTreatment" | "nextInstallment">;

/** Synthetic, keyed by the same `pat-N` ids as `mock-data.ts` — no real patient information. */
const OVERVIEW_BY_PATIENT_ID: Record<string, OverviewFixture> = {
  "pat-1": {
    recentActivity: [
      { id: "act-1", date: "2026-08-23", type: "consultation", translationKey: "patientDetail.activity.consultationCompleted" },
      { id: "act-2", date: "2026-08-23", type: "payment", translationKey: "patientDetail.activity.paymentReceived", amount: 500 },
      { id: "act-3", date: "2026-08-20", type: "document", translationKey: "patientDetail.activity.documentAdded" },
      { id: "act-4", date: "2026-08-18", type: "appointment", translationKey: "patientDetail.activity.appointmentConfirmed" },
      { id: "act-5", date: "2026-08-15", type: "treatment", translationKey: "patientDetail.activity.treatmentSessionCompleted" },
    ],
  },
  "pat-2": {
    recentActivity: [
      { id: "act-6", date: "2026-08-20", type: "appointment", translationKey: "patientDetail.activity.appointmentConfirmed" },
    ],
  },
};

const EMPTY_OVERVIEW: OverviewFixture = {
  recentActivity: [],
};

/**
 * `activeTreatment` is derived from the centralized treatment-plan
 * fixtures (`mock-treatments-data.ts`, UI-004C §33) and `nextInstallment`
 * from the centralized invoice fixtures (`mock-invoices-data.ts`,
 * UI-004D §15-16) rather than hand-duplicated numbers, so the Aperçu
 * overview card can never disagree with the Treatments/Factures tabs.
 */
export function getPatientOverview(patientId: string): PatientOverview {
  const fixture = OVERVIEW_BY_PATIENT_ID[patientId] ?? EMPTY_OVERVIEW;
  const patientPlans = getTreatmentPlansForPatient(getTreatmentPlansMockData(), patientId);
  const financialSummary = getPatientFinancialSummary(getInvoicesMockData(), patientId);

  return {
    patientId,
    activeTreatment: getActiveTreatmentSummary(patientPlans),
    nextInstallment: financialSummary?.nextInstallment ?? null,
    ...fixture,
  };
}
