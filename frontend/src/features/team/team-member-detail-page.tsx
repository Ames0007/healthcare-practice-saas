"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { TEAM_ROLE_MAP } from "@/components/domain/team/team-role";
import { TEAM_MEMBER_STATUS_MAP } from "@/components/domain/team/team-member-status";
import type { TeamMember, TeamMemberFormValues } from "@/components/domain/team/types";
import { getTeamMembersMockData } from "./mock-data";
import { formatDayMonthYear, getTeamMemberFullName, getTeamMemberInitials } from "./format";
import { TeamMemberFormDialog } from "./components/team-member-form-dialog";
import { TeamMemberDetailSkeleton } from "./components/team-member-detail-skeleton";

export type TeamMemberDetailState = "loading" | "loaded" | "error";

export interface TeamMemberDetailPageProps {
  memberId: string;
  state?: TeamMemberDetailState;
  /** Prototype seam for tests, mirrors `PatientDetailPage` (UI-004A §11). */
  members?: TeamMember[];
  onRetry?: () => void;
}

/**
 * Employee profile (UI-007A §30-31, Spec #9 Screen 34). Only the "Profil"
 * surface is in scope — Planning/Congés/Paie/Documents/Permissions
 * (Screen 34's own tab bar) belong to UI-007B through UI-007F, so no tab
 * bar is rendered here yet.
 *
 * Looks the member up from the same centralized seed dataset the directory
 * uses (UI-007A), but edits made here update only this page's own local
 * state, not `/app/equipe`'s array — the same documented prototype
 * limitation as `PatientDetailPage` (UI-004A §7): there is no shared store
 * yet, so a change made in one screen is not visible in the other until
 * real API integration replaces this seam.
 */
export function TeamMemberDetailPage({ memberId, state = "loaded", members: providedMembers, onRetry }: TeamMemberDetailPageProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [overrideMember, setOverrideMember] = useState<TeamMember | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  if (state === "loading") {
    return <TeamMemberDetailSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("teamDetail.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("teamDetail.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const members = providedMembers ?? getTeamMembersMockData();
  const seedMember = members.find((candidate) => candidate.id === memberId) ?? null;
  const member = overrideMember ?? seedMember;

  if (!member) {
    return (
      <EmptyState
        title={t("teamDetail.notFoundTitle")}
        description={t("teamDetail.notFoundDescription")}
        primaryAction={
          <Link href="/app/equipe" className={buttonClassNames("primary", "sm")}>
            {t("teamDetail.backToTeam")}
          </Link>
        }
      />
    );
  }

  const roleMeta = TEAM_ROLE_MAP[member.role];
  const statusMeta = TEAM_MEMBER_STATUS_MAP[member.status];

  const currentMember: TeamMember = member;

  function openEditForm() {
    setFormOpen(true);
    setFormKey((key) => key + 1);
  }

  function handleFormSubmit(values: TeamMemberFormValues) {
    setOverrideMember({
      ...currentMember,
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
