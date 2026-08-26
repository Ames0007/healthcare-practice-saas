import type { StatusTone } from "@/components/ui/status-badge";
import type { TeamMemberStatus } from "./types";

interface TeamMemberStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central team-member status -> tone/label registry (UI-007A §14), mirroring `cash-session-status.ts`'s pattern. */
export const TEAM_MEMBER_STATUS_MAP: Record<TeamMemberStatus, TeamMemberStatusMeta> = {
  active: { tone: "success", translationKey: "team.status.active" },
  inactive: { tone: "neutral", translationKey: "team.status.inactive" },
};
