"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button, buttonClassNames } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { PatientHeader } from "@/components/domain/patients/patient-header";
import type { PatientTabKey, PatientOverview } from "@/components/domain/patients/types";
import { getPatientsMockData } from "./mock-data";
import { getPatientOverview } from "./mock-overview-data";
import { formatDayMonthTime, formatMad, getPatientFullName, getPatientInitials, computeAge } from "./format";
import { getTodayIso } from "./patient-form-validation";
import { PatientOverviewContent } from "./components/patient-overview-content";
import { PatientAppointmentsContent } from "./components/patient-appointments-content";
import { PatientTabPlaceholder } from "./components/patient-tab-placeholder";
import { PatientDetailSkeleton } from "./components/patient-detail-skeleton";
import type { Patient } from "./types";

export type PatientDetailState = "loading" | "loaded" | "error";

export interface PatientDetailPageProps {
  patientId: string;
  activeTab?: PatientTabKey;
  state?: PatientDetailState;
  /** Prototype seams for tests, mirroring every other feature page (UI-001 §40). */
  patients?: Patient[];
  overview?: PatientOverview;
  onRetry?: () => void;
}

const TAB_ORDER: PatientTabKey[] = ["overview", "health", "appointments", "treatments", "invoices", "payments"];

const TAB_PATH_SUFFIX: Record<PatientTabKey, string> = {
  overview: "",
  health: "/health",
  appointments: "/appointments",
  treatments: "/treatments",
  invoices: "/invoices",
  payments: "/payments",
};

/**
 * Patient 360° — header, tabs and Aperçu overview (UI-004A). Looks the
 * patient up from the same centralized seed dataset the Patients list
 * uses (UI-003A/B) — UI-003B's create/edit changes live only in
 * `/app/patients`'s own component state and do not reach this route
 * (documented prototype limitation, UI-004A §7); a patient created there
 * won't be found here until real API integration replaces this seam.
 */
export function PatientDetailPage({
  patientId,
  activeTab = "overview",
  state = "loaded",
  patients: providedPatients,
  overview: providedOverview,
  onRetry,
}: PatientDetailPageProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (state === "loading") {
    return <PatientDetailSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patientDetail.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patientDetail.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const patients = providedPatients ?? getPatientsMockData();
  const patient = patients.find((candidate) => candidate.id === patientId) ?? null;

  if (!patient) {
    return (
      <EmptyState
        title={t("patientDetail.notFoundTitle")}
        description={t("patientDetail.notFoundDescription")}
        primaryAction={
          <Link href="/app/patients" className={buttonClassNames("primary", "sm")}>
            {t("patientDetail.backToPatients")}
          </Link>
        }
      />
    );
  }

  const overview = providedOverview ?? getPatientOverview(patientId);
  const age = patient.birthDate ? computeAge(patient.birthDate, getTodayIso()) : null;

  const nextAppointment = patient.nextAppointment
    ? { label: formatDayMonthTime(patient.nextAppointment, locale), service: patient.nextAppointment.service ?? null }
    : null;
  const balance = patient.outstandingBalance > 0 ? { label: formatMad(patient.outstandingBalance, locale) } : null;

  function showFutureNotice() {
    setToastMessage(t("patientDetail.header.futureFeatureNotice"));
  }

  return (
    <div className="flex flex-col gap-6">
      <PatientHeader
        patient={{
          fullName: getPatientFullName(patient),
          initials: getPatientInitials(patient),
          patientNumber: patient.patientNumber,
          phone: patient.phone,
          age,
          practitionerName: patient.responsiblePractitionerName,
          nextAppointment,
          balance,
        }}
        onFacturer={showFutureNotice}
        onEncaisser={showFutureNotice}
        onPlus={showFutureNotice}
      />

      <Tabs
        ariaLabel={t("patientDetail.tabs.navigationLabel")}
        activeKey={activeTab}
        items={TAB_ORDER.map((tab) => ({
          key: tab,
          label: t(`patientDetail.tabs.${tab}`),
          href: `/app/patients/${patientId}${TAB_PATH_SUFFIX[tab]}`,
        }))}
      />

      {activeTab === "overview" ? (
        <PatientOverviewContent overview={overview} nextAppointment={nextAppointment} balance={balance} />
      ) : activeTab === "appointments" ? (
        <PatientAppointmentsContent patientId={patientId} />
      ) : (
        <PatientTabPlaceholder tab={activeTab} />
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
