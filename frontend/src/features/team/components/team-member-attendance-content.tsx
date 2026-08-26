"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ATTENDANCE_STATUS_MAP } from "@/components/domain/team/attendance-status";
import type { AttendanceRecord, AttendanceStatus, WorkInterval } from "@/components/domain/team/types";
import {
  computeAttendance,
  getAttendanceForDate,
  getAttendanceForMember,
  getExpectedIntervalsForDate,
  isBusinessDateInPast,
  resolveAttendanceStatus,
} from "@/features/team/attendance";
import { formatDayMonthYear, formatMinutesDuration } from "@/features/team/format";

export interface TeamMemberAttendanceContentProps {
  teamMemberId: string;
  businessDate: string;
  todayIso: string;
  workIntervals: WorkInterval[];
  attendanceRecords: AttendanceRecord[];
  /** Approved leave covering `businessDate`, if any (§33) — applied here as contextual presentation, never mutating attendance data. */
  isOnApprovedLeave: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

/**
 * The "Présence" tab (UI-007CDEF §23) — today's own planning-vs-actual
 * comparison plus a restrained recent history. PRESENCE, never PLANNING
 * (already shown on the Planning tab) — every "expected" figure here is
 * read from `WorkInterval` (Gate 1's own source-of-truth chain, never a
 * second hardcoded schedule, §15).
 */
export function TeamMemberAttendanceContent({
  teamMemberId,
  businessDate,
  todayIso,
  workIntervals,
  attendanceRecords,
  isOnApprovedLeave,
  onCheckIn,
  onCheckOut,
}: TeamMemberAttendanceContentProps) {
  const { t, locale } = useLocale();

  const expectedIntervals = getExpectedIntervalsForDate(workIntervals, teamMemberId, businessDate);
  const todayRecord = getAttendanceForDate(attendanceRecords, teamMemberId, businessDate);
  const isRestDay = expectedIntervals.length === 0;
  const isPast = isBusinessDateInPast(businessDate, todayIso);
  const computation = computeAttendance(todayRecord ?? {}, expectedIntervals);
  const rawStatus = isRestDay ? null : resolveAttendanceStatus(todayRecord ?? {}, expectedIntervals, isPast);
  const statusMeta = rawStatus ? ATTENDANCE_STATUS_MAP[rawStatus] : null;

  const history = getAttendanceForMember(attendanceRecords, teamMemberId).filter((record) => record.businessDate !== businessDate);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.attendance.todayTitle")}</h2>
          {isRestDay ? (
            <StatusBadge tone="neutral">{t("teamDetail.attendance.restDay")}</StatusBadge>
          ) : isOnApprovedLeave ? (
            <StatusBadge tone="info">{t("teamDetail.attendance.onLeave")}</StatusBadge>
          ) : (
            statusMeta && <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
          )}
        </div>

        {isRestDay ? (
          <p className="mt-4 text-sm text-text-secondary">{t("teamDetail.attendance.restDayDescription")}</p>
        ) : isOnApprovedLeave ? (
          <p className="mt-4 text-sm text-text-secondary">{t("teamDetail.attendance.onLeaveDescription")}</p>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-text-muted">{t("teamDetail.attendance.expectedLabel")}</dt>
                <dd className="mt-1 text-sm text-text" dir="ltr">
                  {expectedIntervals.map((interval) => `${interval.startTime}–${interval.endTime}`).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t("teamDetail.attendance.checkInLabel")}</dt>
                <dd className="mt-1 text-sm text-text" dir="ltr">
                  {todayRecord?.checkIn ?? t("team.notProvided")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t("teamDetail.attendance.checkOutLabel")}</dt>
                <dd className="mt-1 text-sm text-text" dir="ltr">
                  {todayRecord?.checkOut ?? t("team.notProvided")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t("teamDetail.attendance.workedLabel")}</dt>
                <dd className="mt-1 text-sm text-text">
                  {todayRecord?.checkOut ? formatMinutesDuration(computation.workedMinutes) : t("team.notProvided")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t("teamDetail.attendance.lateLabel")}</dt>
                <dd className="mt-1 text-sm text-text">
                  {computation.lateMinutes > 0 ? formatMinutesDuration(computation.lateMinutes) : t("teamDetail.attendance.none")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">{t("teamDetail.attendance.overtimeLabel")}</dt>
                <dd className="mt-1 text-sm text-text">
                  {computation.overtimeMinutes > 0 ? formatMinutesDuration(computation.overtimeMinutes) : t("teamDetail.attendance.none")}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-3 border-t border-border pt-4">
              {!todayRecord?.checkIn && (
                <Button type="button" onClick={onCheckIn}>
                  {t("teamDetail.attendance.checkInAction")}
                </Button>
              )}
              {todayRecord?.checkIn && !todayRecord?.checkOut && (
                <Button type="button" onClick={onCheckOut}>
                  {t("teamDetail.attendance.checkOutAction")}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("teamDetail.attendance.historyTitle")}</h2>
          <div className="mt-4 flex flex-col divide-y divide-border">
            {history.map((record) => {
              const recordExpected = getExpectedIntervalsForDate(workIntervals, teamMemberId, record.businessDate);
              const recordStatus: AttendanceStatus | null = resolveAttendanceStatus(record, recordExpected, true);
              const recordMeta = recordStatus ? ATTENDANCE_STATUS_MAP[recordStatus] : null;

              return (
                <div key={record.id} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-sm text-text">{formatDayMonthYear(record.businessDate, locale)}</span>
                  <span className="text-sm text-text-secondary" dir="ltr">
                    {record.checkIn ?? "—"} – {record.checkOut ?? "—"}
                  </span>
                  {recordMeta && <StatusBadge tone={recordMeta.tone}>{t(recordMeta.translationKey)}</StatusBadge>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
