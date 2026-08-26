import type { StatusTone } from "@/components/ui/status-badge";
import type { AttendanceStatus } from "./types";

interface AttendanceStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central attendance status -> tone/label registry (UI-007CDEF §13), mirroring `cash-session-status.ts`'s pattern. */
export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatus, AttendanceStatusMeta> = {
  not_checked_in: { tone: "neutral", translationKey: "team.attendanceStatus.notCheckedIn" },
  present: { tone: "success", translationKey: "team.attendanceStatus.present" },
  late: { tone: "warning", translationKey: "team.attendanceStatus.late" },
  completed: { tone: "success", translationKey: "team.attendanceStatus.completed" },
  absent: { tone: "danger", translationKey: "team.attendanceStatus.absent" },
};
