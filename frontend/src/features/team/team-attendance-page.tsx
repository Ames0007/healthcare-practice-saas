"use client";

import { useLocale } from "@/i18n/locale-provider";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ATTENDANCE_STATUS_MAP } from "@/components/domain/team/attendance-status";
import type { AttendanceRecord, TeamMember, WorkInterval } from "@/components/domain/team/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getTeamMembersMockData } from "./mock-data";
import { getWorkIntervalsMockData } from "./mock-schedule-data";
import { getAttendanceMockData } from "./mock-attendance-data";
import {
  computeAttendance,
  getAttendanceForDate,
  getExpectedIntervalsForDate,
  isBusinessDateInPast,
  resolveAttendanceStatus,
  resolveCabinetBucket,
  summarizeCabinetAttendance,
} from "./attendance";
import { formatMinutesDuration, getTeamMemberFullName } from "./format";
import { TeamSkeleton } from "./components/team-skeleton";

export type TeamAttendancePageState = "loading" | "loaded" | "error";

export interface TeamAttendancePageProps {
  businessDate?: string;
  members?: TeamMember[];
  workIntervals?: WorkInterval[];
  attendanceRecords?: AttendanceRecord[];
  state?: TeamAttendancePageState;
  onRetry?: () => void;
}

/**
 * Cabinet-level operational attendance workspace (UI-007CDEF §22), reached
 * from the Équipe directory rather than a new main-sidebar entry (§66).
 * Every row's own "expected" figure comes from `WorkInterval` — never a
 * second hardcoded schedule. `businessDate` defaults to the same
 * `MOCK_BUSINESS_DATE` every other screen in this product anchors "today"
 * to (a Sunday — correctly a rest day for the whole cabinet by default;
 * the seam exists so a real work day can be demonstrated in tests/manual
 * review without inventing a second "today").
 */
export function TeamAttendancePage({
  businessDate = MOCK_BUSINESS_DATE,
  members: providedMembers,
  workIntervals: providedWorkIntervals,
  attendanceRecords: providedAttendanceRecords,
  state = "loaded",
  onRetry,
}: TeamAttendancePageProps) {
  const { t } = useLocale();

  if (state === "loading") {
    return <TeamSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("teamAttendance.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("teamAttendance.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const members = providedMembers ?? getTeamMembersMockData();
  const workIntervals = providedWorkIntervals ?? getWorkIntervalsMockData();
  const attendanceRecords = providedAttendanceRecords ?? getAttendanceMockData();

  const isPastDate = isBusinessDateInPast(businessDate, MOCK_BUSINESS_DATE);

  const rows = members.map((member) => {
    const expectedIntervals = getExpectedIntervalsForDate(workIntervals, member.id, businessDate);
    const record = getAttendanceForDate(attendanceRecords, member.id, businessDate);
    const isRestDay = expectedIntervals.length === 0;
    const status = isRestDay ? null : resolveAttendanceStatus(record ?? {}, expectedIntervals, isPastDate);
    const computation = computeAttendance(record ?? {}, expectedIntervals);
    const bucket = resolveCabinetBucket(status, computation.lateMinutes);

    return { member, expectedIntervals, record, status, bucket, computation };
  });

  const counts = summarizeCabinetAttendance(rows.map((row) => row.bucket));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("teamAttendance.pageTitle")} description={t("teamAttendance.pageDescription")} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label={t("teamAttendance.counts.present")} value={String(counts.present)} emphasis="success" />
        <MetricCard label={t("teamAttendance.counts.late")} value={String(counts.late)} emphasis="warning" />
        <MetricCard label={t("teamAttendance.counts.absent")} value={String(counts.absent)} emphasis="danger" />
        <MetricCard label={t("teamAttendance.counts.notCheckedIn")} value={String(counts.notCheckedIn)} emphasis="neutral" />
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
                <th className="px-4 py-3 text-start">{t("teamAttendance.table.member")}</th>
                <th className="px-4 py-3 text-start">{t("teamAttendance.table.planning")}</th>
                <th className="px-4 py-3 text-start">{t("teamAttendance.table.checkIn")}</th>
                <th className="px-4 py-3 text-start">{t("teamAttendance.table.checkOut")}</th>
                <th className="px-4 py-3 text-start">{t("teamAttendance.table.worked")}</th>
                <th className="px-4 py-3 text-start">{t("teamAttendance.table.status")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ member, expectedIntervals, record, bucket, computation }) => {
                // The row's own badge follows the same 4-bucket categorization as the
                // summary counts above (a late-but-completed day stays "En retard",
                // never flips to "Terminé") — never the raw 5-value `AttendanceStatus`,
                // which would silently contradict the counts.
                const statusMeta = bucket ? ATTENDANCE_STATUS_MAP[bucket] : null;

                return (
                  <tr key={member.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <Link href={`/app/equipe/${member.id}/attendance`} className="font-medium text-primary hover:underline">
                        {getTeamMemberFullName(member)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary" dir="ltr">
                      {expectedIntervals.length > 0
                        ? expectedIntervals.map((interval) => `${interval.startTime}–${interval.endTime}`).join(", ")
                        : t("teamAttendance.restDay")}
                    </td>
                    <td className="px-4 py-3 text-text-secondary" dir="ltr">
                      {record?.checkIn ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary" dir="ltr">
                      {record?.checkOut ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {record?.checkOut ? formatMinutesDuration(computation.workedMinutes) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {statusMeta ? (
                        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">{t("teamAttendance.restDay")}</StatusBadge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
