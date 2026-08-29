"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import type { LeaveRequest, LeaveRequestStatus, LeaveType, TeamMember } from "@/components/domain/team/types";
import type { CabinetCalendarException, CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { addDaysIso, formatWeekRangeLabel, getWeekStart } from "@/features/agenda/format";
import { getCabinetWorkingHoursMockData } from "@/features/parametres/mock-cabinet-working-hours-data";
import { getCabinetCalendarExceptionsMockData } from "@/features/parametres/mock-calendar-exceptions-data";
import { getTeamMembersMockData } from "./mock-data";
import { getLeaveRequestsMockData } from "./mock-leave-data";
import {
  buildLeaveCalendarEvents,
  buildLeaveCalendarMonth,
  countApprovedLeaveTouchingMonth,
  countPendingRequests,
  formatMonthYear,
  getApprovedTeamMembersAway,
  getEventsForDate,
  getMonthStartIso,
  groupLeaveEventsByMonth,
  resolveStatusFilterValues,
  shiftMonthIso,
  type LeaveCalendarEvent,
  type LeaveCalendarStatusFilter,
} from "./leave-calendar";
import { LeaveCalendarHeader, type LeaveCalendarViewMode } from "./components/leave-calendar-header";
import { LeaveCalendarMonthView } from "./components/leave-calendar-month-view";
import { LeaveCalendarWeekView } from "./components/leave-calendar-week-view";
import { LeaveCalendarListView } from "./components/leave-calendar-list-view";
import { LeaveEventDrawer } from "./components/leave-event-drawer";
import { LeaveCalendarSkeleton } from "./components/leave-calendar-skeleton";

export type TeamLeaveCalendarPageState = "loading" | "loaded" | "error";

export interface TeamLeaveCalendarPageProps {
  /** Prototype seam (mirrors `TeamAttendancePage`) — a real work day can be demonstrated in tests/manual review without inventing a second "today". */
  businessDate?: string;
  members?: TeamMember[];
  requests?: LeaveRequest[];
  workingHours?: CabinetWorkingHoursDay[];
  exceptions?: CabinetCalendarException[];
  state?: TeamLeaveCalendarPageState;
  onRetry?: () => void;
}

/**
 * Cabinet-wide Leave Agenda (UI-LEAVE-X), reached from the Équipe
 * directory rather than a new main-sidebar entry (task §3) — mirrors
 * `TeamAttendancePage`'s exact "cabinet-level workspace beside the
 * per-member `[id]` routes" precedent. Purely a read-projection over the
 * EXISTING `LeaveRequest`/`TeamMember` sources (task §4) — this page
 * creates no new leave record and never mutates one; the only write
 * surface for leave remains the per-employee Congés tab
 * (`TeamMemberLeaveContent`, UI-007CDEF), which this page links out to
 * ("Voir la demande") rather than duplicating.
 */
export function TeamLeaveCalendarPage({
  businessDate = MOCK_BUSINESS_DATE,
  members: providedMembers,
  requests: providedRequests,
  workingHours: providedWorkingHours,
  exceptions: providedExceptions,
  state = "loaded",
  onRetry,
}: TeamLeaveCalendarPageProps) {
  const { t, locale } = useLocale();

  const [viewMode, setViewMode] = useState<LeaveCalendarViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(businessDate);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<LeaveType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LeaveCalendarStatusFilter>("operational");
  const [selectedEvent, setSelectedEvent] = useState<LeaveCalendarEvent | null>(null);

  if (state === "loading") {
    return <LeaveCalendarSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("teamLeaveCalendar.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("teamLeaveCalendar.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const members = providedMembers ?? getTeamMembersMockData();
  const requests = providedRequests ?? getLeaveRequestsMockData();
  const workingHours = providedWorkingHours ?? getCabinetWorkingHoursMockData();
  const exceptions = providedExceptions ?? getCabinetCalendarExceptionsMockData();

  const allEvents = buildLeaveCalendarEvents(requests, members);
  const displayEvents = allEvents.filter(
    (event) =>
      (employeeFilter === "all" || event.teamMemberId === employeeFilter) &&
      (typeFilter === "all" || event.leaveType === typeFilter),
  );
  const statuses = resolveStatusFilterValues(statusFilter);

  const monthStart = getMonthStartIso(selectedDate);
  const weekStart = getWeekStart(selectedDate);
  const periodLabel = viewMode === "week" ? formatWeekRangeLabel(weekStart, locale) : formatMonthYear(monthStart, locale);

  // Dashboard metrics (task §30) are always whole-cabinet and anchored to
  // the real business date — never scoped to whichever period is
  // currently being browsed below, exactly like every other "today"/"this
  // month" metric widget in this product (Aujourd'hui, Finance dashboard).
  const awayToday = getApprovedTeamMembersAway(allEvents, businessDate).length;
  const pendingCount = countPendingRequests(allEvents);
  const plannedThisMonth = countApprovedLeaveTouchingMonth(allEvents, getMonthStartIso(businessDate));

  function handleNavigate(direction: "prev" | "next" | "today") {
    if (direction === "today") {
      setSelectedDate(businessDate);
      return;
    }
    if (viewMode === "week") {
      setSelectedDate((current) => addDaysIso(current, direction === "next" ? 7 : -7));
    } else {
      setSelectedDate((current) => shiftMonthIso(getMonthStartIso(current), direction === "next" ? 1 : -1));
    }
  }

  const monthDays = buildLeaveCalendarMonth(monthStart, displayEvents, statuses);
  const currentMonthDays = monthDays.filter((day) => day.isCurrentMonth);
  const listGroups = groupLeaveEventsByMonth(
    displayEvents.filter((event) => statuses === undefined || statuses.includes(event.status)),
    locale,
  ).filter((group) => group.monthKey === monthStart.slice(0, 7));

  const hasVisibleContent =
    viewMode === "month"
      ? currentMonthDays.some((day) => day.events.length > 0)
      : viewMode === "week"
        ? getWeekEventCount(displayEvents, weekStart, statuses) > 0
        : listGroups.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <LeaveCalendarHeader
        periodLabel={periodLabel}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onNavigate={handleNavigate}
        members={members}
        employeeFilter={employeeFilter}
        onEmployeeFilterChange={setEmployeeFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label={t("teamLeaveCalendar.metrics.awayToday")} value={String(awayToday)} emphasis={awayToday > 0 ? "warning" : "neutral"} />
        <MetricCard label={t("teamLeaveCalendar.metrics.pending")} value={String(pendingCount)} emphasis={pendingCount > 0 ? "primary" : "neutral"} />
        <MetricCard label={t("teamLeaveCalendar.metrics.plannedThisMonth")} value={String(plannedThisMonth)} />
      </div>

      {!hasVisibleContent ? (
        <EmptyState title={t("teamLeaveCalendar.empty.title")} description={t("teamLeaveCalendar.empty.description")} />
      ) : viewMode === "month" ? (
        <LeaveCalendarMonthView
          days={monthDays}
          businessDate={businessDate}
          workingHours={workingHours}
          exceptions={exceptions}
          onSelectEvent={setSelectedEvent}
        />
      ) : viewMode === "week" ? (
        <LeaveCalendarWeekView
          weekStartIso={weekStart}
          businessDate={businessDate}
          events={displayEvents}
          statuses={statuses}
          workingHours={workingHours}
          exceptions={exceptions}
          onSelectEvent={setSelectedEvent}
        />
      ) : (
        <LeaveCalendarListView groups={listGroups} onSelectEvent={setSelectedEvent} />
      )}

      <LeaveEventDrawer event={selectedEvent} open={selectedEvent !== null} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

function getWeekEventCount(events: LeaveCalendarEvent[], weekStartIso: string, statuses?: LeaveRequestStatus[]): number {
  const days = Array.from({ length: 7 }, (_, index) => addDaysIso(weekStartIso, index));
  return days.reduce((count, date) => count + getEventsForDate(events, date, statuses).length, 0);
}
