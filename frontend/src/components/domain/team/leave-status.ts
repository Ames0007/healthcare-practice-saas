import type { StatusTone } from "@/components/ui/status-badge";
import type { LeaveRequestStatus } from "./types";

interface LeaveStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central leave-request status -> tone/label registry (UI-007CDEF §28), mirroring `cash-session-status.ts`'s pattern. */
export const LEAVE_STATUS_MAP: Record<LeaveRequestStatus, LeaveStatusMeta> = {
  pending: { tone: "warning", translationKey: "team.leaveStatus.pending" },
  approved: { tone: "success", translationKey: "team.leaveStatus.approved" },
  rejected: { tone: "danger", translationKey: "team.leaveStatus.rejected" },
};
