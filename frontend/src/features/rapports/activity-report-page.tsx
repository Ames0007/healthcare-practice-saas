"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { AgendaAppointment, AgendaPractitioner } from "@/features/agenda/types";
import type { Invoice, Payment } from "@/components/domain/finance/types";
import { getAgendaMockAppointments, PRACTITIONERS } from "@/features/agenda/mock-data";
import { getInvoicesMockData } from "@/features/patients/mock-invoices-data";
import { getPaymentsMockData } from "@/features/patients/mock-payments-data";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getPeriodRange } from "@/features/finance/aggregations";
import type { FinancePeriod } from "@/features/finance/types";
import { PeriodSelector } from "@/features/finance/components/period-selector";
import { ReportsNav } from "./components/reports-nav";
import { ReportsSkeleton } from "./components/reports-skeleton";
import { ActivityKpiSummary } from "./components/activity-kpi-summary";
import { StatusBreakdownTable } from "./components/status-breakdown-table";
import { PractitionerActivityTable } from "./components/practitioner-activity-table";
import { buildAppointmentStatusBreakdown, buildPractitionerActivityRows, computeActivityReportKpis } from "./activity-report";

const DEFAULT_PERIOD: FinancePeriod = "month";

export type ActivityReportPageState = "loading" | "loaded" | "error";

export interface ActivityReportPageProps {
  appointments?: AgendaAppointment[];
  invoices?: Invoice[];
  payments?: Payment[];
  practitioners?: AgendaPractitioner[];
  state?: ActivityReportPageState;
  onRetry?: () => void;
}

/** Reports — Activité (UI-010ABC Gate 1), `/app/rapports/activite`. Every figure derives from Agenda's own appointment fixture, joined to Finance's own invoice/payment fixtures for collections — never a second appointment/invoice universe. */
export function ActivityReportPage({
  appointments: providedAppointments,
  invoices: providedInvoices,
  payments: providedPayments,
  practitioners = PRACTITIONERS,
  state = "loaded",
  onRetry,
}: ActivityReportPageProps) {
  const { t } = useLocale();
  const [period, setPeriod] = useState<FinancePeriod>(DEFAULT_PERIOD);

  if (state === "loading") {
    return <ReportsSkeleton metricCount={3} />;
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

  const appointments = providedAppointments ?? getAgendaMockAppointments();
  const invoices = providedInvoices ?? getInvoicesMockData();
  const payments = providedPayments ?? getPaymentsMockData();

  const range = getPeriodRange(period, MOCK_BUSINESS_DATE);
  const kpis = computeActivityReportKpis(appointments, range);
  const statusBreakdown = buildAppointmentStatusBreakdown(appointments, range);
  const practitionerRows = buildPractitionerActivityRows(appointments, invoices, payments, practitioners, range);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("rapports.activity.pageTitle")} description={t("rapports.activity.pageDescription")} />

      <ReportsNav />

      <div className="flex flex-col gap-8">
        <PeriodSelector period={period} onChange={setPeriod} />

        <ActivityKpiSummary kpis={kpis} />

        <StatusBreakdownTable rows={statusBreakdown} />

        <PractitionerActivityTable rows={practitionerRows} />
      </div>
    </div>
  );
}
