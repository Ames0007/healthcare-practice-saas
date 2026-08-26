import { CalendarHeart, HeartPulse, HandCoins, FileQuestion, type LucideIcon } from "lucide-react";
import type { LeaveType } from "./types";

interface LeaveTypeMeta {
  translationKey: string;
  icon: LucideIcon;
}

/** Central leave type -> label/icon registry (UI-007CDEF §27), mirroring `team-role.ts`'s pattern — no detailed Moroccan statutory leave categories invented. */
export const LEAVE_TYPE_MAP: Record<LeaveType, LeaveTypeMeta> = {
  annual: { translationKey: "team.leaveType.annual", icon: CalendarHeart },
  sick: { translationKey: "team.leaveType.sick", icon: HeartPulse },
  unpaid: { translationKey: "team.leaveType.unpaid", icon: HandCoins },
  other: { translationKey: "team.leaveType.other", icon: FileQuestion },
};
