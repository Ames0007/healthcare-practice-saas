"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Toast } from "@/components/ui/toast";
import { getEmptyPatientsMockData, getPatientsMockData, PATIENTS_TODAY_DATE, PRACTITIONERS } from "./mock-data";
import { filterPatients } from "./filter-patients";
import { findDuplicatePatients } from "./duplicate-detection";
import { generatePatientNumber } from "./patient-number";
import { PatientsFilters } from "./components/patients-filters";
import { PatientTable } from "./components/patient-table";
import { PatientCardList } from "./components/patient-card-list";
import { PatientsSkeleton } from "./components/patients-skeleton";
import { PatientFormDialog, type PatientFormResult } from "./components/patient-form-dialog";
import type { NextAppointmentFilter, Patient, PatientFormValues } from "./types";

export type PatientsPageState = "loading" | "loaded" | "empty" | "error";

export interface PatientsPageProps {
  /** Prototype seam, mirrors Aujourd'hui/Agenda (UI-001 §40): swap for a real query result later. */
  patients?: Patient[];
  state?: PatientsPageState;
  onRetry?: () => void;
}

interface FormDialogState {
  mode: "create" | "edit";
  editingId?: string;
  patientNumber?: string;
  initialValues?: Partial<PatientFormValues>;
}

const PAGE_SIZE = 10;

/**
 * Patients — list, search, lightweight filters (UI-003A) and create/edit
 * with duplicate detection (UI-003B). Owns the single centralized patient
 * array — the list, search/filters and the create/edit drawer all read
 * from and update this one array, so a new or edited patient is
 * immediately visible everywhere without a separate sync step (mirrors
 * Agenda's centralized appointment array, UI-002). Mock data only; nothing
 * persists across refresh.
 */
export function PatientsPage({ patients: providedPatients, state = "loaded", onRetry }: PatientsPageProps) {
  const { t } = useLocale();
  const [patients, setPatients] = useState<Patient[]>(
    () => providedPatients ?? (state === "empty" ? getEmptyPatientsMockData() : getPatientsMockData()),
  );

  const [search, setSearch] = useState("");
  const [practitionerId, setPractitionerId] = useState("all");
  const [nextAppointment, setNextAppointment] = useState<NextAppointmentFilter>("all");
  const [page, setPage] = useState(1);
  const [formDialog, setFormDialog] = useState<FormDialogState | null>(null);
  const [formDialogKey, setFormDialogKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const nextIdRef = useRef(1);

  if (state === "loading") {
    return <PatientsSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patients.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patients.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handlePractitionerChange(value: string) {
    setPractitionerId(value);
    setPage(1);
  }

  function handleNextAppointmentChange(value: NextAppointmentFilter) {
    setNextAppointment(value);
    setPage(1);
  }

  function handleClearFilters() {
    setSearch("");
    setPractitionerId("all");
    setNextAppointment("all");
    setPage(1);
  }

  function openCreateForm() {
    setFormDialog({ mode: "create" });
    setFormDialogKey((key) => key + 1);
  }

  function openEditForm(patient: Patient) {
    setFormDialog({
      mode: "edit",
      editingId: patient.id,
      patientNumber: patient.patientNumber,
      initialValues: {
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        responsiblePractitionerId: patient.responsiblePractitionerId,
        birthDate: patient.birthDate ?? "",
        email: patient.email ?? "",
        city: patient.city ?? "",
        address: patient.address ?? "",
        emergencyContactName: patient.emergencyContactName ?? "",
        emergencyContactPhone: patient.emergencyContactPhone ?? "",
        cin: patient.cin ?? "",
        isSociallyCovered: patient.isSociallyCovered ?? false,
        insuranceRegime: patient.insuranceRegime ?? "",
      },
    });
    setFormDialogKey((key) => key + 1);
  }

  function handlePatientFormSubmit(values: PatientFormValues, options: { forceCreate: boolean }): PatientFormResult {
    const editingId = formDialog?.mode === "edit" ? formDialog.editingId : undefined;

    if (!options.forceCreate) {
      const duplicates = findDuplicatePatients(patients, values, editingId);
      if (duplicates.length > 0) {
        return { ok: false, duplicates };
      }
    }

    const practitioner = PRACTITIONERS.find((item) => item.id === values.responsiblePractitionerId)!;
    const administrativeFields = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      responsiblePractitionerId: practitioner.id,
      responsiblePractitionerName: practitioner.name,
      birthDate: values.birthDate || null,
      email: values.email || null,
      city: values.city || null,
      address: values.address || null,
      emergencyContactName: values.emergencyContactName || null,
      emergencyContactPhone: values.emergencyContactPhone || null,
      cin: values.cin || null,
      isSociallyCovered: values.isSociallyCovered,
      insuranceRegime: values.isSociallyCovered ? values.insuranceRegime || null : null,
    };

    if (editingId) {
      setPatients((current) =>
        current.map((patient) => (patient.id === editingId ? { ...patient, ...administrativeFields } : patient)),
      );
      setToastMessage(t("patients.toast.updated"));
    } else {
      const created: Patient = {
        id: `pat-new-${nextIdRef.current}`,
        patientNumber: generatePatientNumber(patients),
        ...administrativeFields,
        lastVisit: null,
        nextAppointment: null,
        outstandingBalance: 0,
      };
      nextIdRef.current += 1;
      setPatients((current) => [created, ...current]);
      setToastMessage(t("patients.toast.created"));
    }

    setFormDialog(null);
    return { ok: true };
  }

  const hasNoPatients = patients.length === 0;
  const filtered = filterPatients(patients, { search, practitionerId, nextAppointment }, PATIENTS_TODAY_DATE);
  const hasActiveFilters = search.trim() !== "" || practitionerId !== "all" || nextAppointment !== "all";
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("patients.pageTitle")}
        description={t("patients.pageDescription")}
        primaryAction={
          <Button type="button" onClick={openCreateForm}>
            {t("patients.newPatient")}
          </Button>
        }
      />

      {hasNoPatients ? (
        <EmptyState
          title={t("patients.empty.title")}
          description={t("patients.empty.description")}
          primaryAction={
            <Button size="sm" onClick={openCreateForm}>
              {t("patients.empty.action")}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <PatientsFilters
            search={search}
            onSearchChange={handleSearchChange}
            practitionerId={practitionerId}
            onPractitionerChange={handlePractitionerChange}
            nextAppointment={nextAppointment}
            onNextAppointmentChange={handleNextAppointmentChange}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            resultCount={filtered.length}
          />

          {filtered.length === 0 ? (
            <EmptyState
              title={t("patients.filteredEmpty.title")}
              primaryAction={
                <Button size="sm" variant="outline" onClick={handleClearFilters}>
                  {t("patients.filteredEmpty.action")}
                </Button>
              }
            />
          ) : (
            <>
              <Card className="p-0">
                <PatientTable patients={pageItems} onEdit={openEditForm} />
                <PatientCardList patients={pageItems} onEdit={openEditForm} />
              </Card>

              <Pagination
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
                previousLabel={t("common.previous")}
                nextLabel={t("common.next")}
                pageLabel={t("patients.pageLabel", { page: safePage, pageCount })}
              />
            </>
          )}
        </div>
      )}

      <PatientFormDialog
        key={formDialogKey}
        open={formDialog !== null}
        mode={formDialog?.mode ?? "create"}
        initialValues={formDialog?.initialValues}
        patientNumber={formDialog?.patientNumber}
        onClose={() => setFormDialog(null)}
        onSubmit={handlePatientFormSubmit}
        practitioners={PRACTITIONERS}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
