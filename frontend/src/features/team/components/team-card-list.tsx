"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { TEAM_ROLE_MAP } from "@/components/domain/team/team-role";
import { TEAM_MEMBER_STATUS_MAP } from "@/components/domain/team/team-member-status";
import type { TeamMember } from "@/components/domain/team/types";
import { getTeamMemberFullName, getTeamMemberInitials } from "@/features/team/format";

export interface TeamCardListProps {
  members: TeamMember[];
  onEdit: (member: TeamMember) => void;
}

/** Mobile stacked cards (UI-007A §28) — no horizontal overflow, mirrors `PatientCardList`. */
export function TeamCardList({ members, onEdit }: TeamCardListProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col divide-y divide-border md:hidden">
      {members.map((member) => {
        const roleMeta = TEAM_ROLE_MAP[member.role];
        const statusMeta = TEAM_MEMBER_STATUS_MAP[member.status];

        return (
          <div key={member.id} className="flex flex-col gap-2 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar initials={getTeamMemberInitials(member)} />
                <div className="min-w-0">
                  <p className="truncate font-medium text-text">{getTeamMemberFullName(member)}</p>
                  <p className="text-xs text-text-muted" dir="ltr">
                    {member.employeeNumber}
                  </p>
                </div>
              </div>
              <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
            </div>

            <p className="text-sm text-text-secondary">
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
            </p>

            <p className="text-sm text-text-secondary" dir="ltr">
              {member.phone ?? t("team.notProvided")}
            </p>
            <p className="text-sm text-text-secondary" dir="ltr">
              {member.email ?? t("team.notProvided")}
            </p>

            <div className="mt-1 flex items-center gap-4 text-sm">
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
          </div>
        );
      })}
    </div>
  );
}
