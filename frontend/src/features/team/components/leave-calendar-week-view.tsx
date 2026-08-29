"use client";

import { useLocale } from "@/i18n/locale-provider";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import { LEAVE_STATUS_MAP } from "@/components/domain/team/leave-status";
import { CALENDAR_EXCEPTION_TYPE_MAP } from "@/components/domain/settings/calendar-exception-type";
import { formatDayNumber, formatWeekdayShort } from "@/features/agenda/format";
import {
  countApprovedPractitionersAway,
  getApprovedTeamMembersAway,
  getCabinetClosureForDate,
  getEventsForDate,
  getWeekDates,
  type LeaveCalendarEvent,
} from "@/features/team/leave-calendar";
import type { LeaveRequestStatus } from "@/components/domain/team/types";
import type { CabinetCalendarException, CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import { cn } from "@/lib/cn";

export interface LeaveCalendarWeekViewProps {
  weekStartIso: string;
  businessDate: string;
  events: LeaveCalendarEvent[];
  statuses?: LeaveRequestStatus[];
  workingHours: CabinetWorkingHoursDay[];
  exceptions: CabinetCalendarException[];
  onSelectEvent: (event: LeaveCalendarEvent) => void;
}

/**
 * Week view (task §11) — a day-column, all-day representation, never an
 * hourly timeline (leave has no time-of-day component, unlike Agenda's own
 * appointment grid). Every day shows its full event list — a week naturally
 * has far fewer concurrent events than a month, so no compact-overflow
 * treatment is needed here the way Month view needs one.
 */
export function LeaveCalendarWeekView({
  weekStartIso,
  businessDate,
  events,
  statuses,
  workingHours,
  exceptions,
  onSelectEvent,
}: LeaveCalendarWeekViewProps) {
  const { t, locale } = useLocale();
  const days = getWeekDates(weekStartIso);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7 gap-px rounded-lg border border-border bg-border">
        {days.map((date) => {
          const dayEvents = getEventsForDate(events, date, statuses);
          const closure = getCabinetClosureForDate(date, workingHours, exceptions);
          const awayCount = getApprovedTeamMembersAway(events, date).length;
          const practitionersAway = countApprovedPractitionersAway(events, date);
          const isToday = date === businessDate;

          return (
            <div
              key={date}
              className={cn("flex min-h-40 flex-col gap-2 bg-surface p-2", isToday && "ring-2 ring-inset ring-primary")}
            >
              <div>
                <p className="text-xs font-medium uppercase text-text-muted">{formatWeekdayShort(date, locale)}</p>
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-semibold text-text">{formatDayNumber(date, locale)}</p>
                  {awayCount === 1 && (
                    <span className="text-[10px] font-medium text-text-muted">
                      {t("teamLeaveCalendar.membersAway", { count: awayCount })}
                    </span>
                  )}
                </div>
              </div>

              {/* Full-sentence overlap warning (task §25) only when multiple team members are simultaneously away — the compact count badge above already covers the single-absence case. */}
              {awayCount >= 2 && (
                <div className="flex flex-col gap-0.5 rounded bg-warning-soft px-1.5 py-1 text-[11px] font-medium text-warning">
                  <p>{t("teamLeaveCalendar.overlapWarning", { count: awayCount })}</p>
                  {practitionersAway > 0 && <p>{t("teamLeaveCalendar.practitionersAway", { count: practitionersAway })}</p>}
                </div>
              )}

              {closure && (
                <p className="rounded bg-danger-soft px-1.5 py-1 text-[11px] font-medium text-danger">
                  {t("teamLeaveCalendar.closure.badge")} — {t(CALENDAR_EXCEPTION_TYPE_MAP[closure.exceptionType].translationKey)}
                </p>
              )}

              <div className="flex flex-col gap-1.5">
                {dayEvents.map((event) => {
                  const typeMeta = LEAVE_TYPE_MAP[event.leaveType];
                  const statusMeta = LEAVE_STATUS_MAP[event.status];
                  return (
                    <button
                      key={event.leaveRequestId}
                      type="button"
                      onClick={() => onSelectEvent(event)}
                      className={cn(
                        "truncate rounded px-1.5 py-1 text-start text-xs font-medium",
                        statusMeta.tone === "success" && "bg-success-soft text-success",
                        statusMeta.tone === "warning" && "bg-warning-soft text-warning",
                        statusMeta.tone === "danger" && "bg-danger-soft text-danger",
                      )}
                    >
                      {event.employeeName} — {t(typeMeta.translationKey)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
