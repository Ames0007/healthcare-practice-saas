import type { TeamMember } from "@/components/domain/team/types";

/**
 * Live usage derivation (UI-011ABC Gate 2, task §27: "Where a limit
 * exists and existing fixtures can provide usage: derive it... Do not
 * independently hardcode 3/5 practitioners if the 3 can be derived").
 * Reuses Équipe's own `TeamMember` fixtures (UI-007A) — never a second,
 * independent headcount. Only `status === "active"` members count,
 * mirroring every other Équipe-derived count in this codebase (e.g.
 * `computeHrReportKpis`'s own `activeHeadcount`).
 */
export function countActivePractitioners(members: TeamMember[]): number {
  return members.filter((member) => member.role === "practitioner" && member.status === "active").length;
}

/** Every active, non-practitioner member — reception/assistant/other staff roles alike. */
export function countActiveStaff(members: TeamMember[]): number {
  return members.filter((member) => member.role !== "practitioner" && member.status === "active").length;
}
