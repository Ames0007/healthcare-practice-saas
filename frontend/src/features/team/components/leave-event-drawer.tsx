"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { LEAVE_TYPE_MAP } from "@/components/domain/team/leave-type";
import { LEAVE_STATUS_MAP } from "@/components/domain/team/leave-status";
import { formatDayMonthYear } from "@/features/team/format";
import type { LeaveCalendarEvent } from "@/features/team/leave-calendar";

export interface LeaveEventDrawerProps {
  event: LeaveCalendarEvent | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Read-only leave-event detail (task §19) — no edit/approve/reject action
 * anywhere here, since this drawer is a calendar-projection surface, not
 * the leave-management workspace. "Voir la demande" (task §20) only
 * navigates to the existing per-employee Congés tab, which already owns
 * every create/approve/reject workflow — never a second `LeaveRequestForm`.
 */
export function LeaveEventDrawer({ event, open, onClose }: LeaveEventDrawerProps) {
  const { t, locale } = useLocale();

  if (!event) {
    return null;
  }

  const typeMeta = LEAVE_TYPE_MAP[event.leaveType];
  const statusMeta = LEAVE_STATUS_MAP[event.status];

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={event.employeeName} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-text">{event.employeeName}</h2>
          <p className="text-sm text-text-muted" dir="ltr">
            {event.employeeNumber}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-medium text-text">{t(typeMeta.translationKey)}</p>
          <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("teamLeaveCalendar.drawer.startLabel")}</dt>
            <dd className="mt-1 text-sm text-text" dir="ltr">
              {formatDayMonthYear(event.startDate, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("teamLeaveCalendar.drawer.endLabel")}</dt>
            <dd className="mt-1 text-sm text-text" dir="ltr">
              {formatDayMonthYear(event.endDate, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("teamLeaveCalendar.drawer.durationLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{t("teamDetail.leave.durationValue", { count: event.duration })}</dd>
          </div>
        </dl>

        {event.reason && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("teamLeaveCalendar.drawer.reasonLabel")}</p>
            <p className="mt-1 text-sm text-text">{event.reason}</p>
          </div>
        )}

        <Link
          href={`/app/equipe/${event.teamMemberId}/leave`}
          className="w-fit text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {t("teamLeaveCalendar.drawer.viewRequest")}
        </Link>
      </div>
    </Dialog>
  );
}
