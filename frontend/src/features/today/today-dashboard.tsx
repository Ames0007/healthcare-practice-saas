"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import { getEmptyTodayMockData, getTodayMockData } from "./mock-data";
import { formatBusinessDate } from "./format";
import type { TodayDashboardData } from "./types";
import { KpiRow } from "./components/kpi-row";
import { NextAppointmentSection } from "./components/next-appointment-section";
import { AgendaPanel } from "./components/agenda-panel";
import { AttentionPanel } from "./components/attention-panel";
import { FinancePanel } from "./components/finance-panel";
import { TodayDashboardSkeleton } from "./components/today-dashboard-skeleton";

export type TodayDashboardState = "loading" | "loaded" | "empty" | "error";

export interface TodayDashboardProps {
  /**
   * Prototype seam (UI-001 §40): swap this prop for a real
   * `TodayDashboardQuery`/API result later without touching any of the
   * visual components below.
   */
  data?: TodayDashboardData;
  state?: TodayDashboardState;
  onRetry?: () => void;
}

/**
 * Aujourd'hui — daily practice command center (Spec #7 §6, Spec #9 §11).
 * Renders against mock data only; no backend integration (UI-001 §39).
 */
export function TodayDashboard({ data: providedData, state = "loaded", onRetry }: TodayDashboardProps) {
  const { t, locale } = useLocale();
  const data = providedData ?? (state === "empty" ? getEmptyTodayMockData() : getTodayMockData());
  const [agenda, setAgenda] = useState(() => data.agenda);

  function handleMarkArrived(id: string) {
    setAgenda((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status: "arrived" as const } : appointment,
      ),
    );
  }

  if (state === "loading") {
    return <TodayDashboardSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("aujourdhui.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("aujourdhui.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const nextAppointment = agenda.find((appointment) => appointment.id === data.nextAppointmentId) ?? null;
  const businessDateLabel = formatBusinessDate(data.businessDate, locale);
  const isEmptyDay = agenda.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <PageHeader
          title={t("aujourdhui.pageTitle")}
          secondaryAction={<span className="text-sm font-medium text-text-muted">{businessDateLabel}</span>}
        />
        <div className="-mt-6">
          <p className="text-base font-medium text-text">
            {t("aujourdhui.greeting", { name: data.practitionerName })}
          </p>
          <p className="mt-1 text-sm text-text-muted">{t("aujourdhui.subtitle")}</p>
        </div>
      </div>

      <KpiRow kpis={data.kpis} />

      {isEmptyDay ? (
        <EmptyState
          title={t("aujourdhui.empty.title")}
          description={t("aujourdhui.empty.description")}
          primaryAction={
            <Link href="/app/agenda" className={buttonClassNames("primary", "sm")}>
              {t("aujourdhui.empty.action")}
            </Link>
          }
        />
      ) : (
        <>
          {nextAppointment && (
            <NextAppointmentSection appointment={nextAppointment} onMarkArrived={handleMarkArrived} />
          )}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <AgendaPanel agenda={agenda} />
            <AttentionPanel items={data.attentionItems} />
          </div>
        </>
      )}

      <FinancePanel finance={data.finance} />
    </div>
  );
}
