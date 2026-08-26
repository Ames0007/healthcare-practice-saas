import type { TeamMember, TeamRoleFilter, TeamStatusFilter } from "@/components/domain/team/types";
import { normalizePhoneDigits } from "@/features/patients/normalize";
import { getTeamMemberFullName } from "./format";

export interface TeamMemberFilterState {
  search: string;
  role: TeamRoleFilter;
  status: TeamStatusFilter;
}

function matchesSearch(member: TeamMember, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;

  const fullName = getTeamMemberFullName(member).toLowerCase();
  const normalizedQueryDigits = normalizedQuery.replace(/\s+/g, "");

  return (
    fullName.includes(normalizedQuery) ||
    member.firstName.toLowerCase().includes(normalizedQuery) ||
    member.lastName.toLowerCase().includes(normalizedQuery) ||
    member.employeeNumber.toLowerCase().includes(normalizedQuery) ||
    (member.phone ? normalizePhoneDigits(member.phone).includes(normalizedQueryDigits) : false) ||
    (member.email ? member.email.toLowerCase().includes(normalizedQuery) : false)
  );
}

/** Local, in-memory filtering only (UI-007A §20-23) — no backend query, mirrors `filterPatients`. */
export function filterTeamMembers(members: TeamMember[], filters: TeamMemberFilterState): TeamMember[] {
  const normalizedQuery = filters.search.trim().toLowerCase();

  return members.filter(
    (member) =>
      matchesSearch(member, normalizedQuery) &&
      (filters.role === "all" || member.role === filters.role) &&
      (filters.status === "all" || member.status === filters.status),
  );
}
