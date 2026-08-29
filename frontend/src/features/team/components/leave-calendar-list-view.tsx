"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import { LEAVE_STATUS_MAP } from "@/components/domain/team/leave-status";
import { formatEventDateRange, type LeaveCalendarEvent, type LeaveCalendarMonthGroup } from "@/features/team/leave-calendar";

export interface LeaveCalendarListViewProps {
  groups: LeaveCalendarMonthGroup[];
  onSelectEvent: (event: LeaveCalendarEvent) => void;
}

/**
 * Compact chronological alternative (task §12) — especially useful on
 * mobile (task §37), and the presentation Mobile falls back to entirely
 * (no forced 7-column grid on a 375px screen).
 */
export function LeaveCalendarListView({ groups, onSelectEvent }: LeaveCalendarListViewProps) {
  const { t, locale } = useLocale();

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.monthKey} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{group.monthLabel}</h2>
          <Card className="p-0">
            <div className="flex flex-col divide-y divide-border">
              {group.events.map((event) => {
                const typeMeta = LEAVE_TYPE_MAP[event.leaveType];
                const statusMeta = LEAVE_STATUS_MAP[event.status];

                return (
                  <button
                    key={event.leaveRequestId}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className="flex flex-col gap-1 px-4 py-3 text-start hover:bg-surface-subtle sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-text-muted" dir="ltr">
                        {formatEventDateRange(event, locale)}
                      </p>
                      <p className="text-sm font-medium text-text">{event.employeeName}</p>
                      <p className="text-sm text-text-secondary">
                        {t(typeMeta.translationKey)}{" "}
                        <span aria-hidden="true">·</span> {t("teamDetail.leave.durationValue", { count: event.duration })}
                      </p>
                    </div>
                    <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
