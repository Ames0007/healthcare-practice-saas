import { HandHelping, Headset, Stethoscope, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import type { TeamRole } from "./types";

interface TeamRoleMeta {
  translationKey: string;
  icon: LucideIcon;
}

/**
 * Central role -> label/icon registry (UI-007A §12), mirroring
 * `expense-category.ts`'s pattern. Role is a functional/employment
 * category, not a status — this map deliberately carries no `StatusTone`
 * (§12: "Do not assign rainbow colors by role. Role is not a status.").
 */
export const TEAM_ROLE_MAP: Record<TeamRole, TeamRoleMeta> = {
  practitioner: { translationKey: "team.role.practitioner", icon: Stethoscope },
  receptionist: { translationKey: "team.role.receptionist", icon: Headset },
  assistant: { translationKey: "team.role.assistant", icon: HandHelping },
  manager: { translationKey: "team.role.manager", icon: ShieldCheck },
  other: { translationKey: "team.role.other", icon: UserRound },
};
