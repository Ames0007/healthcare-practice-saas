import type { StatusTone } from "@/components/ui/status-badge";
import type { TreatmentPlanStatus } from "./types";

interface TreatmentStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central treatment-plan status → tone/label registry (UI-004C §26), mirroring `appointment-status.ts`'s pattern. */
export const TREATMENT_STATUS_MAP: Record<TreatmentPlanStatus, TreatmentStatusMeta> = {
  active: { tone: "primary", translationKey: "patientDetail.treatments.status.active" },
  completed: { tone: "success", translationKey: "patientDetail.treatments.status.completed" },
  paused: { tone: "warning", translationKey: "patientDetail.treatments.status.paused" },
  cancelled: { tone: "neutral", translationKey: "patientDetail.treatments.status.cancelled" },
};
