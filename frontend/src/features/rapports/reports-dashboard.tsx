"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { CabinetExpense, Invoice, Payment } from "@/components/domain/finance/types";
import type { AttendanceRecord, TeamMember, WorkInterval } from "@/components/domain/team/types";
import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { getExpensesMockData } from "@/features/finance/mock-expenses-data";
import { getTeamMembersMockData } from "@/features/team/mock-data";
import { getAttendanceMockData } from "@/features/team/mock-attendance-data";
import { getWorkIntervalsMockData } from "@/features/team/mock-schedule-data";
import { getInventoryItemsMockData } from "@/features/stock/mock-items-data";
import { getInventoryLotsMockData } from "@/features/stock/mock-lots-data";
import { getStockMovementsMockData } from "@/features/stock/mock-movements-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import type { FinancePeriod } from "@/features/finance/types";
import { PeriodSelector } from "@/features/finance/components/period-selector";
import { ReportsNav } from "./components/reports-nav";
import { OverviewSummary } from "./components/overview-summary";
import { ReportsSkeleton } from "./components/reports-skeleton";
import { computeReportsOverview } from "./overview";

/** Spec #9 Screen 43's own illustrated default ("Ce mois" shown ahead of the period dropdown) — mirrors Finance's own `DEFAULT_PERIOD`. */
const DEFAULT_PERIOD: FinancePeriod = "month";

export type ReportsDashboardState = "loading" | "loaded" | "error";

export interface ReportsDashboardProps {
  /** Prototype seams (mirrors every prior dashboard, e.g. `FinanceDashboard`/`StockDashboard`): swap for real query results later. */
  appointments?: AgendaAppointment[];
  invoices?: Invoice[];
  payments?: Payment[];
  expenses?: CabinetExpense[];
  teamMembers?: TeamMember[];
  attendanceRecords?: AttendanceRecord[];
  workIntervals?: WorkInterval[];
  items?: InventoryItem[];
  lots?: InventoryLot[];
  movements?: StockMovement[];
  state?: ReportsDashboardState;
  onRetry?: () => void;
}

/**
 * Reports — Vue d'ensemble (UI-010ABC Gate 1), the module root at
 * `/app/rapports`. Every KPI is computed by `computeReportsOverview` from
 * the exact same fixtures each detail report page reads — never an
 * independently hardcoded reporting universe (task §8/§9). Mock data only;
 * no backend integration, no persistence.
 */
export function ReportsDashboard({
  appointments: providedAppointments,
  invoices: providedInvoices,
  payments: providedPayments,
  expenses: providedExpenses,
  teamMembers: providedTeamMembers,
  attendanceRecords: providedAttendanceRecords,
  workIntervals: providedWorkIntervals,
  items: providedItems,
  lots: providedLots,
  movements: providedMovements,
  state = "loaded",
  onRetry,
}: ReportsDashboardProps) {
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

  const overview = computeReportsOverview(
    {
      appointments: providedAppointments ?? getAgendaMockAppointments(),
      invoices: providedInvoices ?? getInvoicesMockData(),
      payments: providedPayments ?? getPaymentsMockData(),
      expenses: providedExpenses ?? getExpensesMockData(),
      teamMembers: providedTeamMembers ?? getTeamMembersMockData(),
      attendanceRecords: providedAttendanceRecords ?? getAttendanceMockData(),
      workIntervals: providedWorkIntervals ?? getWorkIntervalsMockData(),
      items: providedItems ?? getInventoryItemsMockData(),
      lots: providedLots ?? getInventoryLotsMockData(),
      movements: providedMovements ?? getStockMovementsMockData(),
    },
    getPeriodRange(period, MOCK_BUSINESS_DATE),
    MOCK_BUSINESS_DATE,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("rapports.pageTitle")} description={t("rapports.pageDescription")} />

      <ReportsNav />

      <div className="flex flex-col gap-8">
        <PeriodSelector period={period} onChange={setPeriod} />

        <OverviewSummary overview={overview} />
      </div>
    </div>
  );
}
