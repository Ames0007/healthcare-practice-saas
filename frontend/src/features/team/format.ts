import type { TeamMember } from "@/components/domain/team/types";

export { formatDayMonthYear } from "@/features/patients/format";

export function getTeamMemberFullName(member: Pick<TeamMember, "firstName" | "lastName">): string {
  return `${member.firstName} ${member.lastName}`;
}

export function getTeamMemberInitials(member: Pick<TeamMember, "firstName" | "lastName">): string {
  return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
}
