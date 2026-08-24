"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClassNames } from "@/components/ui/button";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getPatientFullName } from "@/features/patients/format";

/**
 * Minimal Patient 360° route placeholder (UI-003A §20): preserves the
 * selected patient's synthetic name/reference instead of a generic
 * "not implemented" message. The real Patient 360° overview is UI-004
 * scope — this route intentionally goes no further.
 */
export default function PatientDetailPlaceholderPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLocale();
  const patient = getPatientsMockData().find((candidate) => candidate.id === params.id) ?? null;

  return (
    <EmptyState
      title={patient ? getPatientFullName(patient) : t("patientDetail.notFoundTitle")}
      description={
        patient
          ? t("patientDetail.notice", { number: patient.patientNumber })
          : t("patientDetail.notFoundDescription")
      }
      primaryAction={
        <Link href="/app/patients" className={buttonClassNames("primary", "sm")}>
          {t("patientDetail.back")}
        </Link>
      }
    />
  );
}
