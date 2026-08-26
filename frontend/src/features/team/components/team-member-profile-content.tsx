"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { TEAM_ROLE_MAP } from "@/components/domain/team/team-role";
import { TEAM_MEMBER_STATUS_MAP } from "@/components/domain/team/team-member-status";
import type { TeamMember, TeamMemberFormValues } from "@/components/domain/team/types";
import { formatDayMonthYear } from "@/features/team/format";
import { TeamMemberFormDialog } from "./team-member-form-dialog";

export interface TeamMemberProfileContentProps {
  member: TeamMember;
  onMemberChange: (member: TeamMember) => void;
}

/**
 * The "Profil" tab (UI-007A §31, unchanged content — only its container
 * moved: this used to be `TeamMemberDetailPage`'s entire body before
 * UI-007B added Contrat/Planning as sibling tabs). INFORMATIONS/TRAVAIL
 * cards + bounded edit, identical to UI-007A's own behavior.
 */
export function TeamMemberProfileContent({ member, onMemberChange }: TeamMemberProfileContentProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const roleMeta = TEAM_ROLE_MAP[member.role];
  const statusMeta = TEAM_MEMBER_STATUS_MAP[member.status];

  function openEditForm() {
    setFormOpen(true);
    setFormKey((key) => key + 1);
  }

  function handleFormSubmit(values: TeamMemberFormValues) {
    onMemberChange({
      ...member,
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
      professionalTitle: values.professionalTitle || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      startDate: values.startDate || undefined,
      status: values.status,
    });
    setFormOpen(false);
    setToastMessage(t("team.toast.updated"));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.informationsTitle")}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.phoneLabel")}</dt>
            <dd className="mt-1 text-sm text-text" dir="ltr">
              {member.phone ?? t("team.notProvided")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.emailLabel")}</dt>
            <dd className="mt-1 text-sm text-text" dir="ltr">
              {member.email ?? t("team.notProvided")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.startDateLabel")}</dt>
            <dd className="mt-1 text-sm text-text">
              {member.startDate ? formatDayMonthYear(member.startDate, locale) : t("team.notProvided")}
            </dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.workTitle")}</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.roleLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{t(roleMeta.translationKey)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("teamDetail.statusLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{t(statusMeta.translationKey)}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <Button type="button" variant="outline" onClick={openEditForm}>
          {t("teamDetail.edit")}
        </Button>
      </div>

      <TeamMemberFormDialog
        key={formKey}
        open={formOpen}
        mode="edit"
        employeeNumber={member.employeeNumber}
        initialValues={{
          firstName: member.firstName,
          lastName: member.lastName,
          role: member.role,
          professionalTitle: member.professionalTitle ?? "",
          phone: member.phone ?? "",
          email: member.email ?? "",
          startDate: member.startDate ?? "",
          status: member.status,
        }}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
