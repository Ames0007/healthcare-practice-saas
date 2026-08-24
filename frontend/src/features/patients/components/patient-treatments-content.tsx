"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonClassNames } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { TreatmentPlanCard } from "@/components/domain/treatments/treatment-plan-card";
import type { TreatmentPlan } from "@/components/domain/treatments/types";
import { getTreatmentPlansMockData } from "@/features/patients/mock-treatments-data";
import { formatDayMonth, getPatientFullName } from "@/features/patients/format";
import {
  countSessionsByStatus,
  findNextSession,
  getTreatmentPlansForPatient,
  splitActiveAndCompleted,
} from "@/features/patients/treatments";
import { getPatientsMockData } from "@/features/patients/mock-data";
import type { Patient } from "@/features/patients/types";
import { TreatmentDetailDrawer } from "./treatment-detail-drawer";

export type PatientTreatmentsState = "loading" | "loaded" | "error";

export interface PatientTreatmentsContentProps {
  patientId: string;
  /** Prototype seam for tests (UI-004C §34) — defaults to the centralized mock treatment plans, filtered by `patientId`. */
  plans?: TreatmentPlan[];
  /** Prototype seam for tests — defaults to the centralized patient seed dataset, used only to resolve the display name shown inside the drawer. */
  patients?: Patient[];
  state?: PatientTreatmentsState;
  onRetry?: () => void;
}

const AGENDA_HREF = "/app/agenda";

/**
 * Treatments/Sessions tab (UI-004C). Reads the centralized treatment-plan
 * fixtures filtered by `patientId` — the same fixtures the Aperçu overview
 * card derives its "Traitement actif" summary from (§33), so the two can
 * never disagree. Session/treatment interactions are seed/local prototype
 * behavior only; real cross-route synchronization arrives with the
 * Laravel API (documented limitation, §34).
 */
export function PatientTreatmentsContent({
  patientId,
  plans: providedPlans,
  patients: providedPatients,
  state = "loaded",
  onRetry,
}: PatientTreatmentsContentProps) {
  const { t, locale } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [drawerKey, setDrawerKey] = useState(0);

  function openTreatmentDrawer(planId: string) {
    setSelectedPlanId(planId);
    setDrawerKey((key) => key + 1);
  }

  if (state === "loading") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">{t("common.loading")}</span>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <div className="flex justify-end">
            <Skeleton className="h-9 w-44" />
          </div>
          <Card>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-28 w-full" />
          </Card>
          <Card>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-16 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patientDetail.treatments.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patientDetail.treatments.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  function showFutureNotice() {
    setToastMessage(t("patientDetail.treatments.newTreatmentNotice"));
  }

  const allPlans = providedPlans ?? getTreatmentPlansMockData();
  const patientPlans = getTreatmentPlansForPatient(allPlans, patientId);
  const selectedPlan = patientPlans.find((plan) => plan.id === selectedPlanId) ?? null;
  const patients = providedPatients ?? getPatientsMockData();
  const patient = patients.find((candidate) => candidate.id === patientId);
  const patientName = patient ? getPatientFullName(patient) : "";

  const newTreatmentButton = (
    <Button size="sm" onClick={showFutureNotice}>
      <Plus className="h-4 w-4" aria-hidden="true" />
      {t("patientDetail.treatments.newTreatment")}
    </Button>
  );

  if (patientPlans.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          title={t("patientDetail.treatments.emptyAllTitle")}
          description={t("patientDetail.treatments.emptyAllDescription")}
          primaryAction={newTreatmentButton}
        />
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      </div>
    );
  }

  const { active, completed } = splitActiveAndCompleted(patientPlans);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">{newTreatmentButton}</div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("patientDetail.treatments.activeTitle")}
        </h2>
        <div className="mt-4 flex flex-col gap-4">
          {active.length === 0 ? (
            <p className="text-sm text-text-muted">{t("patientDetail.treatments.noActiveTreatment")}</p>
          ) : (
            active.map((plan) => {
              const { completed: completedSessions, scheduled: scheduledSessions } = countSessionsByStatus(
                plan.sessions,
              );
              const next = findNextSession(plan.sessions);

              return (
                <TreatmentPlanCard
                  key={plan.id}
                  variant="active"
                  title={plan.title}
                  status={plan.status}
                  practitionerName={plan.practitionerName}
                  startDateLabel={formatDayMonth(plan.startDate, locale)}
                  completedSessions={completedSessions}
                  scheduledSessions={scheduledSessions}
                  totalSessions={plan.sessions.length}
                  nextSession={
                    next ? { label: `${formatDayMonth(next.scheduledDate!, locale)} · ${next.scheduledTime}` } : null
                  }
                  actions={
                    <>
                      <Button variant="outline" size="sm" onClick={() => openTreatmentDrawer(plan.id)}>
                        {t("patientDetail.treatments.viewTreatment")}
                      </Button>
                      <Link href={AGENDA_HREF} className={buttonClassNames("ghost", "sm")}>
                        {t("patientDetail.treatments.planNextSession")}
                      </Link>
                    </>
                  }
                />
              );
            })
          )}
        </div>
      </Card>

      {completed.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t("patientDetail.treatments.completedTitle")}
          </h2>
          <div className="mt-4">
            {completed.map((plan) => {
              const { completed: completedSessions } = countSessionsByStatus(plan.sessions);
              return (
                <TreatmentPlanCard
                  key={plan.id}
                  variant="completed"
                  title={plan.title}
                  status={plan.status}
                  practitionerName={plan.practitionerName}
                  startDateLabel={formatDayMonth(plan.startDate, locale)}
                  completedDateLabel={plan.completedDate ? formatDayMonth(plan.completedDate, locale) : undefined}
                  completedSessions={completedSessions}
                  scheduledSessions={0}
                  totalSessions={plan.sessions.length}
                  onSelect={() => openTreatmentDrawer(plan.id)}
                />
              );
            })}
          </div>
        </Card>
      )}

      <TreatmentDetailDrawer
        key={drawerKey}
        plan={selectedPlan}
        patientId={patientId}
        patientName={patientName}
        open={selectedPlanId !== null}
        onClose={() => setSelectedPlanId(null)}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
