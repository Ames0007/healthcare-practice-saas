import type { TeamMember } from "@/components/domain/team/types";

export { formatDayMonthYear } from "@/features/patients/format";

export function getTeamMemberFullName(member: Pick<TeamMember, "firstName" | "lastName">): string {
  return `${member.firstName} ${member.lastName}`;
}

export function getTeamMemberInitials(member: Pick<TeamMember, "firstName" | "lastName">): string {
  return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
}

/** "7 h 45" / "8 h" / "35 min" — a duration only, never a monetary figure (UI-007CDEF §21/§43). */
export function formatMinutesDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest}`;
}
