"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import type { LeaveType, TeamMember } from "@/components/domain/team/types";
import { getTeamMemberFullName } from "@/features/team/format";
import type { LeaveCalendarStatusFilter } from "@/features/team/leave-calendar";

export type LeaveCalendarViewMode = "month" | "week" | "list";

const LEAVE_TYPE_ORDER = Object.keys(LEAVE_TYPE_MAP) as LeaveType[];
const STATUS_FILTER_ORDER: LeaveCalendarStatusFilter[] = ["operational", "approved", "pending", "rejected", "all"];

export interface LeaveCalendarHeaderProps {
  periodLabel: string;
  viewMode: LeaveCalendarViewMode;
  onViewModeChange: (mode: LeaveCalendarViewMode) => void;
  onNavigate: (direction: "prev" | "next" | "today") => void;
  members: TeamMember[];
  employeeFilter: string;
  onEmployeeFilterChange: (value: string) => void;
  typeFilter: LeaveType | "all";
  onTypeFilterChange: (value: LeaveType | "all") => void;
  statusFilter: LeaveCalendarStatusFilter;
  onStatusFilterChange: (value: LeaveCalendarStatusFilter) => void;
}

/**
 * Leave Agenda's persistent controls (task §7) — mirrors `AgendaHeader`'s
 * exact layout/interaction conventions (nav group, view-mode toggle group,
 * plain `Select` filters) without reusing any of its appointment-specific
 * domain components (task §7: "do not duplicate its appointment-specific
 * domain components"). One shared nav row drives all three views —
 * Month/List navigate by whole calendar month, Week navigates by 7 days —
 * exactly like `AgendaHeader`'s own day/week navigation already varies its
 * step by `viewMode`.
 */
export function LeaveCalendarHeader({
  periodLabel,
  viewMode,
  onViewModeChange,
  onNavigate,
  members,
  employeeFilter,
  onEmployeeFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
}: LeaveCalendarHeaderProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-text">{t("teamLeaveCalendar.pageTitle")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("teamLeaveCalendar.pageDescription")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1" role="group" aria-label={t("teamLeaveCalendar.dateNavigation")}>
          <Button variant="outline" size="icon" aria-label={t("teamLeaveCalendar.previous")} onClick={() => onNavigate("prev")}>
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("today")}>
            {t("teamLeaveCalendar.today")}
          </Button>
          <Button variant="outline" size="icon" aria-label={t("teamLeaveCalendar.next")} onClick={() => onNavigate("next")}>
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <span className="ms-2 text-sm font-medium text-text">{periodLabel}</span>
        </div>

        <div className="flex items-center gap-1 rounded-md border border-border-strong p-1" role="group" aria-label={t("teamLeaveCalendar.viewMode")}>
          <Button
            variant={viewMode === "month" ? "primary" : "ghost"}
            size="sm"
            aria-pressed={viewMode === "month"}
            onClick={() => onViewModeChange("month")}
          >
            {t("teamLeaveCalendar.viewMonth")}
          </Button>
          <Button
            variant={viewMode === "week" ? "primary" : "ghost"}
            size="sm"
            aria-pressed={viewMode === "week"}
            onClick={() => onViewModeChange("week")}
          >
            {t("teamLeaveCalendar.viewWeek")}
          </Button>
          <Button
            variant={viewMode === "list" ? "primary" : "ghost"}
            size="sm"
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          >
            {t("teamLeaveCalendar.viewList")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          aria-label={t("teamLeaveCalendar.filters.employeeLabel")}
          className="w-auto"
          value={employeeFilter}
          onChange={(event) => onEmployeeFilterChange(event.target.value)}
          options={[
            { value: "all", label: t("teamLeaveCalendar.filters.employeeAll") },
            ...members.map((member) => ({ value: member.id, label: getTeamMemberFullName(member) })),
          ]}
        />

        <Select
          aria-label={t("teamLeaveCalendar.filters.typeLabel")}
          className="w-auto"
          value={typeFilter}
          onChange={(event) => onTypeFilterChange(event.target.value as LeaveType | "all")}
          options={[
            { value: "all", label: t("teamLeaveCalendar.filters.typeAll") },
            ...LEAVE_TYPE_ORDER.map((type) => ({ value: type, label: t(LEAVE_TYPE_MAP[type].translationKey) })),
          ]}
        />

        <Select
          aria-label={t("teamLeaveCalendar.filters.statusLabel")}
          className="w-auto"
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as LeaveCalendarStatusFilter)}
          options={STATUS_FILTER_ORDER.map((status) => ({
            value: status,
            label: t(`teamLeaveCalendar.filters.status.${status}`),
          }))}
        />
      </div>
    </div>
  );
}
