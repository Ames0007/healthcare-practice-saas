"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonClassNames } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Toast } from "@/components/ui/toast";
import { ClinicalSummarySection } from "@/components/domain/clinical/clinical-summary-section";
import { ConsultationStructuredDetail } from "@/components/domain/clinical/consultation-structured-detail";
import { RelatedAppointmentNote } from "@/components/domain/clinical/related-appointment-note";
import { CONSULTATION_STATUS_MAP } from "@/components/domain/clinical/consultation-status";
import type { ActiveConsultation } from "@/components/domain/clinical/types";
import type { MedicalProfile } from "@/components/domain/clinical/types";
import type { Patient } from "@/features/patients/types";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getMedicalProfilesMockData } from "@/features/patients/mock-medical-profiles-data";
import { getMedicalProfileForPatient } from "@/features/patients/medical-profile";
import { getActiveConsultationsMockData } from "@/features/patients/mock-active-consultations-data";
import { getActiveConsultationById, isConsultationCompletionValid, isConsultationDirty } from "@/features/patients/active-consultation";
import { formatDayMonthYear, getPatientFullName } from "@/features/patients/format";
import { ConsultationForm, type ConsultationFormField } from "./components/consultation-form";
import { ConsultationCompleteDialog } from "./components/consultation-complete-dialog";

export type ConsultationWorkspaceState = "loading" | "loaded" | "error";

export interface ConsultationWorkspacePageProps {
  patientId: string;
  consultationId: string;
  /** Prototype seams for tests, mirroring every other feature page. */
  patients?: Patient[];
  consultations?: ActiveConsultation[];
  profiles?: MedicalProfile[];
  state?: ConsultationWorkspaceState;
  onRetry?: () => void;
}

function resolveInitialConsultation(consultations: ActiveConsultation[] | undefined, consultationId: string) {
  return getActiveConsultationById(consultations ?? getActiveConsultationsMockData(), consultationId);
}

/**
 * Active consultation workspace (UI-005C) — the practitioner-facing
 * counterpart to UI-005B's read-only historical detail. Addressable
 * independently at `/app/patients/{id}/consultations/{consultationId}`
 * rather than a Patient 360° tab, since it is a focused clinical task
 * surface, not a browsing view (§6) — it deliberately does not reuse the
 * full `PatientHeader`/`Tabs` shell (that shell shows the patient's
 * financial balance, which CLAUDE.md §40/this task's own §40 forbid
 * inside the consultation workspace).
 *
 * **Prototype lifecycle boundary (§7/§31/§33):** a completed consultation
 * only changes local component state. It is never written back into
 * UI-005B's `mock-clinical-encounters-data.ts` fixtures, and no
 * `/app/patients/{id}/health` navigation, Agenda appointment status, or
 * global store is touched — introducing one purely to fake that
 * cross-route effect was explicitly out of scope. `toClinicalEncounter`
 * (`active-consultation.ts`) proves the transformation is possible and is
 * covered by tests; real cross-route persistence waits for the backend.
 */
export function ConsultationWorkspacePage({
  patientId,
  consultationId,
  patients: providedPatients,
  consultations: providedConsultations,
  profiles: providedProfiles,
  state = "loaded",
  onRetry,
}: ConsultationWorkspacePageProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<ActiveConsultation | null>(() =>
    resolveInitialConsultation(providedConsultations, consultationId),
  );
  const [savedSnapshot, setSavedSnapshot] = useState<ActiveConsultation | null>(() =>
    resolveInitialConsultation(providedConsultations, consultationId),
  );

  if (state === "loading") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">{t("common.loading")}</span>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_20rem]">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patientDetail.consultation.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patientDetail.consultation.errorRetry")}
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

  if (!consultation || consultation.patientId !== patientId) {
    return (
      <EmptyState
        title={t("patientDetail.consultation.notFoundTitle")}
        description={t("patientDetail.consultation.notFoundDescription")}
        primaryAction={
          <Link href={`/app/patients/${patientId}/health`} className={buttonClassNames("primary", "sm")}>
            {t("patientDetail.consultation.backToHealth")}
          </Link>
        }
      />
    );
  }

  const profiles = providedProfiles ?? getMedicalProfilesMockData();
  const medicalProfile = getMedicalProfileForPatient(profiles, patientId);
  const isCompleted = consultation.status === "completed";
  const isDirty = !isCompleted && savedSnapshot !== null && isConsultationDirty(consultation, savedSnapshot);
  const statusMeta = CONSULTATION_STATUS_MAP[consultation.status];

  function updateField(field: ConsultationFormField, value: string) {
    setConsultation((current) => (current ? { ...current, [field]: value } : current));
    if (field === "reason" && value.trim()) {
      setReasonError(null);
    }
  }

  function handleSaveDraft() {
    if (!consultation) {
      return;
    }
    setSavedSnapshot(consultation);
    setToastMessage(t("patientDetail.consultation.form.draftSaved"));
  }

  function handleRequestComplete() {
    if (!consultation || !isConsultationCompletionValid(consultation)) {
      setReasonError(t("patientDetail.consultation.form.reasonRequiredError"));
      return;
    }
    setReasonError(null);
    setConfirmOpen(true);
  }

  function handleConfirmComplete() {
    if (!consultation) {
      return;
    }
    const completed: ActiveConsultation = { ...consultation, status: "completed", completedAt: consultation.date };
    setConsultation(completed);
    setSavedSnapshot(completed);
    setConfirmOpen(false);
    setToastMessage(t("patientDetail.consultation.completedSuccess"));
  }

  const allergyEntries = medicalProfile?.allergies.map((entry) => ({
    id: entry.id,
    label: entry.label,
    important: entry.importance === "important",
  })) ?? [];
  const historyEntries = medicalProfile?.medicalHistory.map((entry) => ({ id: entry.id, label: entry.label })) ?? [];
  const medicationEntries = medicalProfile?.currentMedications.map((entry) => ({ id: entry.id, label: entry.label })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/app/patients/${patientId}/health`}
        className="w-fit text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        {t("patientDetail.consultation.backToHealth")}
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-text">{getPatientFullName(patient)}</h1>
        <p className="text-sm text-text-muted" dir="ltr">
          {patient.patientNumber}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-text">{t("patientDetail.consultation.heading")}</h2>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
      </div>
      <div>
        <p className="text-sm text-text" dir="ltr">
          {formatDayMonthYear(consultation.date, locale)}
          {consultation.time && ` · ${consultation.time}`}
        </p>
        <p className="text-sm text-text-muted">{consultation.practitionerName}</p>
      </div>

      {consultation.appointmentId && (
        <RelatedAppointmentNote appointmentId={consultation.appointmentId} href={`/app/patients/${patientId}/appointments`} />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_20rem]">
        <div className="order-2 md:order-1">
          {isCompleted ? (
            <div className="flex flex-col gap-4">
              <ConsultationStructuredDetail
                reason={consultation.reason}
                observations={consultation.observations}
                assessment={consultation.assessment}
                plan={consultation.plan}
              />
              {consultation.completedAt && (
                <p className="text-xs text-text-muted">
                  {t("patientDetail.health.lastUpdated", {
                    date: formatDayMonthYear(consultation.completedAt, locale),
                    practitioner: consultation.practitionerName,
                  })}
                </p>
              )}
            </div>
          ) : (
            <ConsultationForm
              reason={consultation.reason}
              observations={consultation.observations ?? ""}
              assessment={consultation.assessment ?? ""}
              plan={consultation.plan ?? ""}
              reasonError={reasonError}
              isDirty={isDirty}
              onChange={updateField}
              onSaveDraft={handleSaveDraft}
              onRequestComplete={handleRequestComplete}
            />
          )}
        </div>

        <div className="order-1 flex flex-col gap-4 md:order-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t("patientDetail.consultation.importantInfoTitle")}
          </h3>
          <ClinicalSummarySection
            title={t("patientDetail.health.allergiesTitle")}
            entries={allergyEntries}
            emptyText={t("patientDetail.health.noAllergies")}
          />
          <ClinicalSummarySection
            title={t("patientDetail.health.historyTitle")}
            entries={historyEntries}
            emptyText={t("patientDetail.health.noHistory")}
          />
          <ClinicalSummarySection
            title={t("patientDetail.health.medicationsTitle")}
            entries={medicationEntries}
            emptyText={t("patientDetail.health.noMedications")}
          />
        </div>
      </div>

      <ConsultationCompleteDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleConfirmComplete} />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
