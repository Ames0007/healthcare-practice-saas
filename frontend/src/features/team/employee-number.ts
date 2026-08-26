import type { TeamMember } from "@/components/domain/team/types";

const EMPLOYEE_NUMBER_PATTERN = /^EMP-(\d+)$/;

/**
 * Local prototype-only sequential reference (UI-007A §10), mirroring
 * `generatePatientNumber` — production numbering will be server-controlled
 * (CLAUDE.md §21/§45), this only has to look right in a single-user demo.
 */
export function generateEmployeeNumber(members: TeamMember[]): string {
  const highest = members.reduce((max, member) => {
    const match = EMPLOYEE_NUMBER_PATTERN.exec(member.employeeNumber);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `EMP-${String(highest + 1).padStart(4, "0")}`;
}
