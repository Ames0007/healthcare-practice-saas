import type { StatusTone } from "@/components/ui/status-badge";
import type { AppointmentStatus } from "@/features/today/types";

interface AppointmentStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/**
 * Central appointment status → tone/label registry (Spec #8 §92, Spec #10
 * §6). Feature code passes a status and reads tone/label from here rather
 * than choosing a `StatusBadge` tone manually at the call site.
 */
export const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, AppointmentStatusMeta> = {
  to_confirm: { tone: "warning", translationKey: "aujourdhui.status.toConfirm" },
  confirmed: { tone: "info", translationKey: "aujourdhui.status.confirmed" },
  arrived: { tone: "info", translationKey: "aujourdhui.status.arrived" },
  in_consultation: { tone: "primary", translationKey: "aujourdhui.status.inConsultation" },
  completed: { tone: "success", translationKey: "aujourdhui.status.completed" },
  no_show: { tone: "danger", translationKey: "aujourdhui.status.noShow" },
};
