import { Ban, CheckCircle2, Circle, Clock, XCircle, type LucideIcon } from "lucide-react";
import type { StatusTone } from "@/components/ui/status-badge";
import type { TreatmentSessionStatus } from "./types";

interface SessionStatusMeta {
  tone: StatusTone;
  translationKey: string;
  icon: LucideIcon;
}

/**
 * Treatment-session status is its own small registry (UI-004C §27) — it
 * does not reuse `APPOINTMENT_STATUS_MAP` from `domain/appointments/`,
 * since a session's lifecycle (unscheduled/scheduled/completed) has
 * different semantics from an appointment's (confirmed/arrived/waiting/...).
 */
export const SESSION_STATUS_MAP: Record<TreatmentSessionStatus, SessionStatusMeta> = {
  completed: { tone: "success", translationKey: "patientDetail.treatments.sessionStatus.completed", icon: CheckCircle2 },
  scheduled: { tone: "info", translationKey: "patientDetail.treatments.sessionStatus.scheduled", icon: Clock },
  unscheduled: { tone: "neutral", translationKey: "patientDetail.treatments.sessionStatus.unscheduled", icon: Circle },
  cancelled: { tone: "neutral", translationKey: "patientDetail.treatments.sessionStatus.cancelled", icon: Ban },
  no_show: { tone: "danger", translationKey: "patientDetail.treatments.sessionStatus.noShow", icon: XCircle },
};

/** Compact tone→class map for the session-tracker grid cells (mirrors `StatusBadge`'s own tone/color pairing, denser presentation — UI-004C §16/§19). */
export const SESSION_STATUS_CELL_CLASSES: Record<StatusTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-subtle text-text-secondary",
};
