"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import type { TeamMember, TeamMemberFormValues, TeamRole, TeamRoleFilter, TeamStatusFilter } from "@/components/domain/team/types";
import { getEmptyTeamMembersMockData, getTeamMembersMockData } from "./mock-data";
import { filterTeamMembers } from "./filter-team-members";
import { generateEmployeeNumber } from "./employee-number";
import { TeamFilters } from "./components/team-filters";
import { TeamTable } from "./components/team-table";
import { TeamCardList } from "./components/team-card-list";
import { TeamSkeleton } from "./components/team-skeleton";
import { TeamMemberFormDialog } from "./components/team-member-form-dialog";

export type TeamPageState = "loading" | "loaded" | "empty" | "error";

export interface TeamPageProps {
  /** Prototype seam, mirrors Patients (UI-003A §40): swap for a real query result later. */
  members?: TeamMember[];
  state?: TeamPageState;
  onRetry?: () => void;
}

interface FormDialogState {
  mode: "create" | "edit";
  editingId?: string;
  employeeNumber?: string;
  initialValues?: Partial<TeamMemberFormValues>;
}

/**
 * Équipe — cabinet team directory, search/filters and bounded create/edit
 * (UI-007A). Owns the single centralized team array the same way
 * `PatientsPage` owns patients: the list, filters and form dialog all read
 * from and update this one array. Mock data only; nothing persists across
 * refresh, and there is no server-controlled employee numbering yet
 * (mirrors UI-003B's `generatePatientNumber`).
 *
 * No pagination (§25): ~8 synthetic members render fine as a single list;
 * pagination was not added merely because Patients has it.
 */
export function TeamPage({ members: providedMembers, state = "loaded", onRetry }: TeamPageProps) {
  const { t } = useLocale();
  const [members, setMembers] = useState<TeamMember[]>(
    () => providedMembers ?? (state === "empty" ? getEmptyTeamMembersMockData() : getTeamMembersMockData()),
  );

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<TeamRoleFilter>("all");
  const [status, setStatus] = useState<TeamStatusFilter>("all");
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null);
  const [formDialogKey, setFormDialogKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const nextIdRef = useRef(1);

  if (state === "loading") {
    return <TeamSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("team.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("team.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  function handleSearchChange(value: string) {
    setSearch(value);
  }

  function handleRoleChange(value: TeamRoleFilter) {
    setRole(value);
  }

  function handleStatusChange(value: TeamStatusFilter) {
    setStatus(value);
  }

  function handleClearFilters() {
    setSearch("");
    setRole("all");
    setStatus("all");
  }

  function openCreateForm() {
    setFormDialog({ mode: "create" });
    setFormDialogKey((key) => key + 1);
  }

  function openEditForm(member: TeamMember) {
    setFormDialog({
      mode: "edit",
      editingId: member.id,
      employeeNumber: member.employeeNumber,
      initialValues: {
        firstName: member.firstName,
        lastName: member.lastName,
        role: member.role,
        professionalTitle: member.professionalTitle ?? "",
        phone: member.phone ?? "",
        email: member.email ?? "",
        startDate: member.startDate ?? "",
        status: member.status,
      },
    });
    setFormDialogKey((key) => key + 1);
  }

  function handleFormSubmit(values: TeamMemberFormValues) {
    const editingId = formDialog?.mode === "edit" ? formDialog.editingId : undefined;

    const administrativeFields = {
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role,
      professionalTitle: values.professionalTitle || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      startDate: values.startDate || undefined,
      status: values.status,
    };

    if (editingId) {
      setMembers((current) =>
        current.map((member) => (member.id === editingId ? { ...member, ...administrativeFields } : member)),
      );
      setToastMessage(t("team.toast.updated"));
    } else {
      const created: TeamMember = {
        id: `team-new-${nextIdRef.current}`,
        employeeNumber: generateEmployeeNumber(members),
        ...administrativeFields,
      };
      nextIdRef.current += 1;
      setMembers((current) => [created, ...current]);
      setToastMessage(t("team.toast.created"));
    }

    setFormDialog(null);
  }

  const hasNoMembers = members.length === 0;
  const filtered = filterTeamMembers(members, { search, role, status });
  const hasActiveFilters = search.trim() !== "" || role !== "all" || status !== "all";
  const availableRoles = Array.from(new Set(members.map((member) => member.role))) as TeamRole[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("team.pageTitle")}
        description={hasNoMembers ? t("team.pageDescription") : t("team.memberCount", { count: members.length })}
        primaryAction={
          <Button type="button" onClick={openCreateForm}>
            {t("team.newMember")}
          </Button>
        }
        secondaryAction={
          <div className="flex items-center gap-3">
            <Link href="/app/equipe/attendance" className={buttonClassNames("outline", "md")}>
              {t("team.attendanceLink")}
            </Link>
            <Link href="/app/equipe/leave-calendar" className={buttonClassNames("outline", "md")}>
              {t("team.leaveCalendarLink")}
            </Link>
          </div>
        }
      />

      {hasNoMembers ? (
        <EmptyState
          title={t("team.empty.title")}
          description={t("team.empty.description")}
          primaryAction={
            <Button size="sm" onClick={openCreateForm}>
              {t("team.empty.action")}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <TeamFilters
            search={search}
            onSearchChange={handleSearchChange}
            role={role}
            onRoleChange={handleRoleChange}
            availableRoles={availableRoles}
            status={status}
            onStatusChange={handleStatusChange}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            resultCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title={t("team.filteredEmpty.title")}
              primaryAction={
                <Button size="sm" variant="outline" onClick={handleClearFilters}>
                  {t("team.filteredEmpty.action")}
                </Button>
              }
            />
          ) : (
            <Card className="p-0">
              <TeamTable members={filtered} onEdit={openEditForm} />
              <TeamCardList members={filtered} onEdit={openEditForm} />
            </Card>
          )}
        </div>
      )}

      <TeamMemberFormDialog
        key={formDialogKey}
        open={formDialog !== null}
        mode={formDialog?.mode ?? "create"}
        initialValues={formDialog?.initialValues}
        employeeNumber={formDialog?.employeeNumber}
        onClose={() => setFormDialog(null)}
        onSubmit={handleFormSubmit}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
