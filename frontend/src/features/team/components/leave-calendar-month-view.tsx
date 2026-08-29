"use client";

import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import { LEAVE_STATUS_MAP } from "@/components/domain/team/leave-status";
import { CALENDAR_EXCEPTION_TYPE_MAP } from "@/components/domain/settings/calendar-exception-type";
import { formatDayNumber, formatWeekdayShort, getWeekDates } from "@/features/agenda/format";
import {
  countApprovedPractitionersAway,
  getApprovedTeamMembersAway,
  getCabinetClosureForDate,
  type LeaveCalendarEvent,
  type LeaveCalendarMonthDay,
} from "@/features/team/leave-calendar";
import type { CabinetCalendarException, CabinetWorkingHoursDay } from "@/components/domain/settings/types";
import { cn } from "@/lib/cn";

const MAX_VISIBLE_EVENTS_PER_CELL = 2;

export interface LeaveCalendarMonthViewProps {
  days: LeaveCalendarMonthDay[];
  businessDate: string;
  workingHours: CabinetWorkingHoursDay[];
  exceptions: CabinetCalendarException[];
  onSelectEvent: (event: LeaveCalendarEvent) => void;
}

/**
 * Month grid (task §8/§10) — the codebase's first month calendar; no
 * existing component to mirror at this granularity (Agenda only ever
 * offers Day/Week, task §7). Every date shows only what actually covers
 * it: a multi-day leave repeats across every date it spans (§9), never
 * only its start date. Cells never grow indefinitely (§10) — at most
 * `MAX_VISIBLE_EVENTS_PER_CELL` entries render, the rest collapse into a
 * compact "+N autres".
 */
export function LeaveCalendarMonthView({ days, businessDate, workingHours, exceptions, onSelectEvent }: LeaveCalendarMonthViewProps) {
  const { t, locale } = useLocale();
  const weekdayLabels = getWeekDates(days[0]?.date ?? businessDate).slice(0, 7);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7 gap-px rounded-lg border border-border bg-border">
        {weekdayLabels.map((day) => (
          <div key={day} className="bg-surface p-2 text-center text-xs font-medium uppercase text-text-muted">
            {formatWeekdayShort(day, locale)}
          </div>
        ))}

        {days.map((day) => {
          const closure = getCabinetClosureForDate(day.date, workingHours, exceptions);
          const awayCount = getApprovedTeamMembersAway(day.events, day.date).length;
          const practitionersAway = countApprovedPractitionersAway(day.events, day.date);
          const visibleEvents = day.events.slice(0, MAX_VISIBLE_EVENTS_PER_CELL);
          const overflowCount = day.events.length - visibleEvents.length;
          const isToday = day.date === businessDate;

          return (
            <div
              key={day.date}
              className={cn(
                "flex min-h-24 flex-col gap-1 bg-surface p-1.5",
                !day.isCurrentMonth && "bg-surface-subtle",
                isToday && "ring-2 ring-inset ring-primary",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={cn("text-xs font-medium", day.isCurrentMonth ? "text-text" : "text-text-muted")}>
                  {formatDayNumber(day.date, locale)}
                </span>
                {day.isCurrentMonth && awayCount > 0 && (
                  <span
                    className="text-[10px] font-medium text-text-muted"
                    title={practitionersAway > 0 ? t("teamLeaveCalendar.practitionersAway", { count: practitionersAway }) : undefined}
                  >
                    {t("teamLeaveCalendar.membersAway", { count: awayCount })}
                  </span>
                )}
              </div>

              {/* Adjacent-month overflow cells stay to the day number only — showing their own events/closure content would visually clutter this month's own grid with entries that do not belong to it. */}
              {day.isCurrentMonth && (
                <>
                  {closure && (
                    <p className="truncate rounded bg-danger-soft px-1 py-0.5 text-[10px] font-medium text-danger">
                      {t("teamLeaveCalendar.closure.badge")} — {t(CALENDAR_EXCEPTION_TYPE_MAP[closure.exceptionType].translationKey)}
                    </p>
                  )}

                  <div className="flex flex-col gap-1">
                    {visibleEvents.map((event) => {
                      const typeMeta = LEAVE_TYPE_MAP[event.leaveType];
                      const statusMeta = LEAVE_STATUS_MAP[event.status];
                      return (
                        <button
                          key={event.leaveRequestId}
                          type="button"
                          onClick={() => onSelectEvent(event)}
                          className={cn(
                            "truncate rounded px-1 py-0.5 text-start text-[10px] font-medium",
                            statusMeta.tone === "success" && "bg-success-soft text-success",
                            statusMeta.tone === "warning" && "bg-warning-soft text-warning",
                            statusMeta.tone === "danger" && "bg-danger-soft text-danger",
                          )}
                        >
                          {event.employeeName.split(" ")[0]} — {t(typeMeta.translationKey)}
                        </button>
                      );
                    })}
                    {overflowCount > 0 && (
                      <span className="text-[10px] text-text-muted">{t("teamLeaveCalendar.moreEvents", { count: overflowCount })}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <StatusBadge tone="success">{t(LEAVE_STATUS_MAP.approved.translationKey)}</StatusBadge>
        </span>
        <span className="flex items-center gap-1">
          <StatusBadge tone="warning">{t(LEAVE_STATUS_MAP.pending.translationKey)}</StatusBadge>
        </span>
      </div>
    </div>
  );
}
