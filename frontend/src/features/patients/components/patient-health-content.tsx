"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { ClinicalSummarySection } from "@/components/domain/clinical/clinical-summary-section";
import type { ClinicalDocument, ClinicalEncounter, MedicalProfile, Prescription } from "@/components/domain/clinical/types";
import { getMedicalProfilesMockData } from "@/features/patients/mock-medical-profiles-data";
import { getMedicalProfileForPatient, isMedicalProfileEmpty } from "@/features/patients/medical-profile";
import { formatDayMonthYear, getPatientFullName } from "@/features/patients/format";
import { getPatientsMockData } from "@/features/patients/mock-data";
import type { Patient } from "@/features/patients/types";
import { MedicalProfileEditDrawer } from "./medical-profile-edit-drawer";
import { ClinicalHistorySection } from "./clinical-history-section";
import { DocumentsSection } from "./documents-section";
import { PrescriptionsSection } from "./prescriptions-section";

export type PatientHealthState = "loading" | "loaded" | "error";

export interface PatientHealthContentProps {
  patientId: string;
  /** Prototype seam for tests (UI-005A §13) — defaults to the centralized mock medical profiles. */
  profiles?: MedicalProfile[];
  patients?: Patient[];
  /** Prototype seam for tests (UI-005B) — defaults to the centralized mock clinical encounters. */
  encounters?: ClinicalEncounter[];
  /** Prototype seam for tests (UI-005D) — defaults to the centralized mock clinical documents. */
  documents?: ClinicalDocument[];
  /** Prototype seam for tests (UI-005D) — defaults to the centralized mock prescriptions. */
  prescriptions?: Prescription[];
  state?: PatientHealthState;
  onRetry?: () => void;
}

/**
 * Dossier Santé tab: the patient's persistent important medical
 * information (UI-005A — allergies, history, current medications,
 * important notes), the clinical-history timeline (UI-005B — completed
 * consultations/sessions, read-only), Documents and Ordonnances (UI-005D
 * — both below Historique clinique, never a seventh Patient 360° tab).
 * Active consultation authoring is a separate route (UI-005C), not part
 * of this tab. An edited profile, a newly uploaded document and a newly
 * created prescription are all kept only in this component's own local
 * state — the centralized fixtures are never mutated, same "local
 * session state, not a global store" convention as UI-004E's payment
 * capture (see `frontend/ARCHITECTURE.md`); no LocalStorage/IndexedDB/
 * cookie is used anywhere for this clinical data (CLAUDE.md §7/UI-005A
 * §7). Loading/error remain a single unified state for the whole tab
 * (§33) — there is no real network boundary between the medical profile
 * and the clinical history in this frontend-only prototype, so splitting
 * them into two independent error surfaces would be artificial.
 */
export function PatientHealthContent({
  patientId,
  profiles: providedProfiles,
  patients: providedPatients,
  encounters,
  documents,
  prescriptions,
  state = "loaded",
  onRetry,
}: PatientHealthContentProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDrawerKey, setEditDrawerKey] = useState(0);
  const [profile, setProfile] = useState<MedicalProfile | null>(() =>
    getMedicalProfileForPatient(providedProfiles ?? getMedicalProfilesMockData(), patientId),
  );

  if (state === "loading") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">{t("common.loading")}</span>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patientDetail.health.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patientDetail.health.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const patients = providedPatients ?? getPatientsMockData();
  const patient = patients.find((candidate) => candidate.id === patientId);
  const practitionerId = patient?.responsiblePractitionerId ?? "";
  const practitionerName = patient?.responsiblePractitionerName ?? "";
  const patientName = patient ? getPatientFullName(patient) : "";

  function openEdit() {
    setEditDrawerKey((key) => key + 1);
    setEditOpen(true);
  }

  function handleSave(updated: MedicalProfile) {
    setProfile(updated);
    setEditOpen(false);
    setToastMessage(t("patientDetail.health.updateSuccess"));
  }

  const editDrawer = (
    <MedicalProfileEditDrawer
      key={editDrawerKey}
      profile={profile}
      patientId={patientId}
      practitionerName={practitionerName}
      open={editOpen}
      onClose={() => setEditOpen(false)}
      onSave={handleSave}
    />
  );

  const profileEmpty = isMedicalProfileEmpty(profile);
  const activeProfile = profile ?? undefined;
  const allergyEntries = (activeProfile?.allergies ?? []).map((entry) => ({
    id: entry.id,
    label: entry.label,
    important: entry.importance === "important",
  }));
  const historyEntries = (activeProfile?.medicalHistory ?? []).map((entry) => ({ id: entry.id, label: entry.label }));
  const medicationEntries = (activeProfile?.currentMedications ?? []).map((entry) => ({ id: entry.id, label: entry.label }));
  const noteEntries = (activeProfile?.importantNotes ?? []).map((note, index) => ({ id: `note-${index}`, label: note }));

  return (
    <div className="flex flex-col gap-6">
      {profileEmpty ? (
        <EmptyState
          title={t("patientDetail.health.emptyAllTitle")}
          primaryAction={
            <Button size="sm" onClick={openEdit}>
              {t("patientDetail.health.emptyAllAction")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.importantInfoTitle")}
            </h2>
            <Button size="sm" onClick={openEdit}>
              {t("patientDetail.health.editButton")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <ClinicalSummarySection
              title={t("patientDetail.health.notesTitle")}
              entries={noteEntries}
              emptyText={t("patientDetail.health.noNotes")}
            />
          </div>

          {activeProfile?.lastUpdatedAt && (
            <p className="text-xs text-text-muted">
              {t("patientDetail.health.lastUpdated", {
                date: formatDayMonthYear(activeProfile.lastUpdatedAt, locale),
                practitioner: activeProfile.lastUpdatedBy ?? "",
              })}
            </p>
          )}
        </>
      )}

      <ClinicalHistorySection patientId={patientId} patientName={patientName} encounters={encounters} />

      <DocumentsSection patientId={patientId} practitionerName={practitionerName} documents={documents} />

      <PrescriptionsSection
        patientId={patientId}
        practitionerId={practitionerId}
        practitionerName={practitionerName}
        prescriptions={prescriptions}
        encounters={encounters}
      />

      {editDrawer}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
