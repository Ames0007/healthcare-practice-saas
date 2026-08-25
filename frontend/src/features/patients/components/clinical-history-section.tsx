"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ClinicalTimeline, type ClinicalTimelineEncounterView, type ClinicalTimelineGroupView } from "@/components/domain/clinical/clinical-timeline";
import type { ClinicalEncounter } from "@/components/domain/clinical/types";
import { getClinicalEncountersMockData } from "@/features/patients/mock-clinical-encounters-data";
import {
  getEncountersForPatient,
  groupEncountersByDate,
  matchesClinicalHistoryFilter,
  sortEncountersDesc,
  type ClinicalHistoryFilterGroup,
} from "@/features/patients/clinical-history";
import { formatDayMonthYear } from "@/features/patients/format";
import { ConsultationDetailDrawer } from "./consultation-detail-drawer";

const FILTER_ORDER: ClinicalHistoryFilterGroup[] = ["all", "consultations", "sessions"];

export interface ClinicalHistorySectionProps {
  patientId: string;
  patientName: string;
  /** Prototype seam for tests (mirrors `PatientHealthContent`'s own `profiles` prop) — defaults to the centralized mock encounters. */
  encounters?: ClinicalEncounter[];
}

function toTimelineView(
  encounter: ClinicalEncounter,
  patientId: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): ClinicalTimelineEncounterView {
  if (encounter.encounterType === "session") {
    return {
      id: encounter.id,
      type: "session",
      timeLabel: encounter.time,
      practitionerName: encounter.practitionerName,
      sessionLabel: t("patientDetail.treatments.sessionHeading", {
        n: encounter.sessionSequenceNumber ?? 0,
        total: encounter.sessionTotalCount ?? 0,
      }),
      treatmentTitle: encounter.treatmentPlanTitle,
      treatmentHref: encounter.treatmentPlanId ? `/app/patients/${patientId}/treatments` : undefined,
    };
  }

  return {
    id: encounter.id,
    type: "consultation",
    timeLabel: encounter.time,
    practitionerName: encounter.practitionerName,
    reason: encounter.reason,
  };
}

/**
 * Clinical-history timeline (UI-005B) — sits below UI-005A's important
 * medical information, inside the same Dossier Santé tab (§6-7). Only the
 * lightweight All/Consultations/Sessions filter (§17); no practitioner/
 * date-range/diagnosis filtering. Consultation records are read-only —
 * "Voir la consultation" opens `ConsultationDetailDrawer`; a session
 * encounter links to the Traitements/Séances tab instead of opening a
 * second session-detail surface (§25-26).
 */
export function ClinicalHistorySection({ patientId, patientName, encounters: providedEncounters }: ClinicalHistorySectionProps) {
  const { t, locale } = useLocale();
  const [filter, setFilter] = useState<ClinicalHistoryFilterGroup>("all");
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null);

  const allEncounters = sortEncountersDesc(
    getEncountersForPatient(providedEncounters ?? getClinicalEncountersMockData(), patientId),
  );
  const filteredEncounters = allEncounters.filter((encounter) => matchesClinicalHistoryFilter(encounter, filter));
  const selectedConsultation =
    allEncounters.find((encounter) => encounter.id === selectedConsultationId && encounter.encounterType === "consultation") ?? null;

  const groups: ClinicalTimelineGroupView[] = groupEncountersByDate(filteredEncounters).map((group) => ({
    dateLabel: formatDayMonthYear(group.date, locale),
    encounters: group.encounters.map((encounter) => toTimelineView(encounter, patientId, t)),
  }));

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("patientDetail.health.history.title")}
      </h2>

      {allEncounters.length === 0 ? (
        <EmptyState
          title={t("patientDetail.health.history.emptyTitle")}
          description={t("patientDetail.health.history.emptyDescription")}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex flex-wrap items-center gap-1 rounded-md border border-border-strong p-1"
              role="group"
              aria-label={t("patientDetail.health.history.title")}
            >
              {FILTER_ORDER.map((group) => (
                <Button
                  key={group}
                  type="button"
                  variant={filter === group ? "primary" : "ghost"}
                  size="sm"
                  aria-pressed={filter === group}
                  onClick={() => setFilter(group)}
                >
                  {t(`patientDetail.health.history.filters.${group}`)}
                </Button>
              ))}
            </div>
            <p className="text-sm text-text-muted" aria-live="polite">
              {t("patientDetail.health.history.resultCount", { count: filteredEncounters.length })}
            </p>
          </div>

          {filteredEncounters.length === 0 ? (
            <p className="text-sm text-text-muted">{t("patientDetail.health.history.filteredEmpty")}</p>
          ) : (
            <ClinicalTimeline groups={groups} onSelectConsultation={setSelectedConsultationId} />
          )}
        </>
      )}

      <ConsultationDetailDrawer
        encounter={selectedConsultation}
        patientId={patientId}
        patientName={patientName}
        open={selectedConsultation !== null}
        onClose={() => setSelectedConsultationId(null)}
      />
    </div>
  );
}
