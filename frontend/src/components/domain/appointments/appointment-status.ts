import type { StatusTone } from "@/components/ui/status-badge";
import type { AppointmentStatus } from "./types";

interface AppointmentStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/**
 * Central appointment status → tone/label registry (Spec #8 §8/§92, Spec
 * #10 §6). Feature code passes a status and reads tone/label from here
 * rather than choosing a `StatusBadge` tone manually at the call site.
 * Extended by UI-002 from UI-001's original 6-status subset — the six
 * original tones are unchanged so Aujourd'hui's appearance does not
 * regress.
 */
export const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, AppointmentStatusMeta> = {
  requested: { tone: "neutral", translationKey: "appointment.status.requested" },
  to_confirm: { tone: "warning", translationKey: "appointment.status.toConfirm" },
  confirmed: { tone: "info", translationKey: "appointment.status.confirmed" },
  arrived: { tone: "info", translationKey: "appointment.status.arrived" },
  waiting: { tone: "warning", translationKey: "appointment.status.waiting" },
  in_consultation: { tone: "primary", translationKey: "appointment.status.inConsultation" },
  completed: { tone: "success", translationKey: "appointment.status.completed" },
  rescheduled: { tone: "neutral", translationKey: "appointment.status.rescheduled" },
  cancelled_by_patient: { tone: "neutral", translationKey: "appointment.status.cancelledByPatient" },
  cancelled_by_practice: { tone: "neutral", translationKey: "appointment.status.cancelledByPractice" },
  no_show: { tone: "danger", translationKey: "appointment.status.noShow" },
};

/** Operational sequence, terminal/negative states last — mirrors `STOCK_ATTENTION_STATUS_ORDER`'s pattern (added UI-010ABC for the Reports status breakdown; no prior module needed a deterministic order). */
export const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = [
  "requested",
  "to_confirm",
  "confirmed",
  "arrived",
  "waiting",
  "in_consultation",
  "completed",
  "rescheduled",
  "cancelled_by_patient",
  "cancelled_by_practice",
  "no_show",
];
