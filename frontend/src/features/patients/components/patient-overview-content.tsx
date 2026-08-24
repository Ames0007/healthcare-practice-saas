"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { PatientActivityTimeline } from "@/components/domain/patients/patient-activity-timeline";
import type { PatientHeaderBalance, PatientHeaderNextAppointment } from "@/components/domain/patients/patient-header";
import type { PatientOverview } from "@/components/domain/patients/types";
import { formatDayMonth, formatMad } from "@/features/patients/format";
import { PatientSummaryCard } from "./patient-summary-card";

export interface PatientOverviewContentProps {
  overview: PatientOverview;
  nextAppointment: PatientHeaderNextAppointment | null;
  balance: PatientHeaderBalance | null;
}

/** Aperçu tab content (Spec #9 Screen 17, UI-004A §25/§29): four summary cards + the unified activity timeline. */
export function PatientOverviewContent({ overview, nextAppointment, balance }: PatientOverviewContentProps) {
  const { t, locale } = useLocale();

  const dateLabels = Object.fromEntries(
    overview.recentActivity.map((item) => [item.id, formatDayMonth(item.date, locale)]),
  );
  const amountLabels = Object.fromEntries(
    overview.recentActivity
      .filter((item) => item.amount !== undefined)
      .map((item) => [item.id, formatMad(item.amount as number, locale)]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PatientSummaryCard
          label={t("patientDetail.overview.nextAppointmentLabel")}
          value={nextAppointment ? nextAppointment.label : t("patientDetail.noNextAppointment")}
          secondary={nextAppointment?.service ?? undefined}
          isEmpty={!nextAppointment}
          valueDir="ltr"
        />
        <PatientSummaryCard
          label={t("patientDetail.overview.activeTreatmentLabel")}
          value={overview.activeTreatment ? overview.activeTreatment.name : t("patientDetail.overview.noActiveTreatment")}
          secondary={
            overview.activeTreatment
              ? t("patientDetail.overview.sessionsProgress", {
                  completed: overview.activeTreatment.completedSessions,
                  total: overview.activeTreatment.totalSessions,
                })
              : undefined
          }
          isEmpty={!overview.activeTreatment}
        />
        <PatientSummaryCard
          label={t("patientDetail.overview.balanceLabel")}
          value={balance ? balance.label : t("patientDetail.overview.noBalance")}
          isEmpty={!balance}
          valueDir="ltr"
        />
        <PatientSummaryCard
          label={t("patientDetail.overview.nextInstallmentLabel")}
          value={
            overview.nextInstallment
              ? formatMad(overview.nextInstallment.amount, locale)
              : t("patientDetail.overview.noInstallment")
          }
          secondary={overview.nextInstallment ? formatDayMonth(overview.nextInstallment.dueDate, locale) : undefined}
          isEmpty={!overview.nextInstallment}
          valueDir="ltr"
        />
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("patientDetail.overview.recentActivityTitle")}
        </h2>
        <div className="mt-4">
          <PatientActivityTimeline
            items={overview.recentActivity}
            dateLabels={dateLabels}
            amountLabels={amountLabels}
            emptyLabel={t("patientDetail.overview.noActivity")}
          />
        </div>
      </Card>
    </div>
  );
}
