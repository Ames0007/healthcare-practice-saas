"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { TEAM_ROLE_MAP } from "@/components/domain/team/team-role";
import { TEAM_MEMBER_STATUS_MAP } from "@/components/domain/team/team-member-status";
import type { TeamMember } from "@/components/domain/team/types";
import { formatDayMonthYear, getTeamMemberFullName, getTeamMemberInitials } from "@/features/team/format";

export interface TeamTableProps {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
}

/**
 * Desktop table (UI-007A §26). Email and "Date d'entrée" are the two
 * lower-priority columns hidden before Contact/Role/Status/Actions on
 * tablet (§29) — mirrors `PatientTable`'s `lg:table-cell` treatment of
 * "Dernière visite".
 */
export function TeamTable({ members, onEdit }: TeamTableProps) {
  const { t, locale } = useLocale();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
            <th className="px-4 py-3 text-start">{t("team.table.member")}</th>
            <th className="px-4 py-3 text-start">{t("team.table.role")}</th>
            <th className="px-4 py-3 text-start">{t("team.table.phone")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("team.table.email")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("team.table.startDate")}</th>
            <th className="px-4 py-3 text-start">{t("team.table.status")}</th>
            <th className="px-4 py-3 text-start">
              <span className="sr-only">{t("team.table.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const roleMeta = TEAM_ROLE_MAP[member.role];
            const statusMeta = TEAM_MEMBER_STATUS_MAP[member.status];

            return (
              <tr key={member.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={getTeamMemberInitials(member)} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text">{getTeamMemberFullName(member)}</p>
                      <p className="text-xs text-text-muted" dir="ltr">
                        {member.employeeNumber}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {t(roleMeta.translationKey)}
                  {member.professionalTitle && (
                    <>
                      {" "}
                      <span aria-hidden="true" className="text-text-muted">
                        ·
                      </span>{" "}
                      <span className="text-text-muted">{member.professionalTitle}</span>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-secondary" dir="ltr">
                  {member.phone ?? t("team.notProvided")}
                </td>
                <td className="hidden px-4 py-3 text-text-secondary lg:table-cell" dir="ltr">
                  {member.email ?? t("team.notProvided")}
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-text-secondary lg:table-cell">
                  {member.startDate ? formatDayMonthYear(member.startDate, locale) : t("team.notProvided")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-end">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/app/equipe/${member.id}`} className="font-medium text-primary hover:underline">
                      {t("team.open")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onEdit(member)}
                      className="font-medium text-text-secondary hover:text-text hover:underline"
                    >
                      {t("team.edit")}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
