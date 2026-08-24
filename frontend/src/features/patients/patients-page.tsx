"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Toast } from "@/components/ui/toast";
import { getEmptyPatientsMockData, getPatientsMockData, PATIENTS_TODAY_DATE } from "./mock-data";
import { filterPatients } from "./filter-patients";
import { PatientsFilters } from "./components/patients-filters";
import { PatientTable } from "./components/patient-table";
import { PatientCardList } from "./components/patient-card-list";
import { PatientsSkeleton } from "./components/patients-skeleton";
import type { NextAppointmentFilter, Patient } from "./types";

export type PatientsPageState = "loading" | "loaded" | "empty" | "error";

export interface PatientsPageProps {
  /** Prototype seam, mirrors Aujourd'hui/Agenda (UI-001 §40): swap for a real query result later. */
  patients?: Patient[];
  state?: PatientsPageState;
  onRetry?: () => void;
}

const PAGE_SIZE = 10;

/**
 * Patients — list, search and lightweight filters (UI-003A). Mock data
 * only; no backend integration, no patient creation/editing, no Patient
 * 360° (UI-003B/UI-004 scope).
 */
export function PatientsPage({ patients: providedPatients, state = "loaded", onRetry }: PatientsPageProps) {
  const { t } = useLocale();
  const patients = providedPatients ?? (state === "empty" ? getEmptyPatientsMockData() : getPatientsMockData());

  const [search, setSearch] = useState("");
  const [practitionerId, setPractitionerId] = useState("all");
  const [nextAppointment, setNextAppointment] = useState<NextAppointmentFilter>("all");
  const [page, setPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  function handleNewPatientClick() {
    setToastMessage(t("patients.newPatientNotice"));
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
          <Button type="button" onClick={handleNewPatientClick}>
            {t("patients.newPatient")}
          </Button>
        }
      />

      {hasNoPatients ? (
        <EmptyState
          title={t("patients.empty.title")}
          description={t("patients.empty.description")}
          primaryAction={
            <Button size="sm" onClick={handleNewPatientClick}>
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
                <PatientTable patients={pageItems} />
                <PatientCardList patients={pageItems} />
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

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
