"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { TEAM_ROLE_MAP } from "@/components/domain/team/team-role";
import { TEAM_MEMBER_STATUS_MAP } from "@/components/domain/team/team-member-status";
import type { TeamMember } from "@/components/domain/team/types";
import { getTeamMemberFullName, getTeamMemberInitials } from "@/features/team/format";

export interface TeamMemberHeaderProps {
  member: TeamMember;
}

/**
 * Persistent Employee 360° identity/context header (UI-007B §6, mirrors
 * `PatientHeader`'s role at the top of Patient 360°) — shared by every
 * tab (Profil/Contrat/Planning), extracted out of `TeamMemberDetailPage`'s
 * own former single-tab body (UI-007A) now that there is more than one
 * tab to show it above.
 */
export function TeamMemberHeader({ member }: TeamMemberHeaderProps) {
  const { t } = useLocale();
  const roleMeta = TEAM_ROLE_MAP[member.role];
  const statusMeta = TEAM_MEMBER_STATUS_MAP[member.status];

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar initials={getTeamMemberInitials(member)} className="h-12 w-12 text-base" />
          <div>
            <h1 className="text-xl font-semibold text-text">{getTeamMemberFullName(member)}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {t(roleMeta.translationKey)}
              {member.professionalTitle && (
                <>
                  {" "}
                  <span aria-hidden="true">·</span> <span>{member.professionalTitle}</span>
                </>
              )}
            </p>
            <p className="text-xs text-text-muted" dir="ltr">
              {member.employeeNumber}
            </p>
          </div>
        </div>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
      </div>
    </Card>
  );
}
