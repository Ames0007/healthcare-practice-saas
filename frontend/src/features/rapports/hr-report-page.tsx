"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { AttendanceRecord, TeamMember, WorkInterval } from "@/components/domain/team/types";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getAttendanceMockData } from "@/features/team/mock-attendance-data";
import { getWorkIntervalsMockData } from "@/features/team/mock-schedule-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import type { FinancePeriod } from "@/features/finance/types";
import { PeriodSelector } from "@/features/finance/components/period-selector";
import { ReportsNav } from "./components/reports-nav";
import { ReportsSkeleton } from "./components/reports-skeleton";
import { HrReportKpiSummary } from "./components/hr-report-kpi-summary";
import { computeHrReportKpis } from "./hr-report";

const DEFAULT_PERIOD: FinancePeriod = "month";

export type HrReportPageState = "loading" | "loaded" | "error";

export interface HrReportPageProps {
  teamMembers?: TeamMember[];
  attendanceRecords?: AttendanceRecord[];
  workIntervals?: WorkInterval[];
  state?: HrReportPageState;
  onRetry?: () => void;
}

/** Reports — Équipe (UI-010ABC Gate 1), `/app/rapports/equipe`. Every figure reuses Équipe's own Gate 1/Gate 3 pure attendance/overtime functions — never a second worked-hours calculation. */
export function HrReportPage({
  teamMembers: providedTeamMembers,
  attendanceRecords: providedAttendanceRecords,
  workIntervals: providedWorkIntervals,
  state = "loaded",
  onRetry,
}: HrReportPageProps) {
  const { t } = useLocale();
  const [period, setPeriod] = useState<FinancePeriod>(DEFAULT_PERIOD);

  if (state === "loading") {
    return <ReportsSkeleton metricCount={4} />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("rapports.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("rapports.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const teamMembers = providedTeamMembers ?? getTeamMembersMockData();
  const attendanceRecords = providedAttendanceRecords ?? getAttendanceMockData();
  const workIntervals = providedWorkIntervals ?? getWorkIntervalsMockData();

  const range = getPeriodRange(period, MOCK_BUSINESS_DATE);
  const kpis = computeHrReportKpis(teamMembers, attendanceRecords, workIntervals, range);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("rapports.equipe.pageTitle")} description={t("rapports.equipe.pageDescription")} />

      <ReportsNav />

      <div className="flex flex-col gap-8">
        <PeriodSelector period={period} onChange={setPeriod} />

        <HrReportKpiSummary kpis={kpis} />
      </div>
    </div>
  );
}
