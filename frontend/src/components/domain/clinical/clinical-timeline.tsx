"use client";

import Link from "next/link";
import { Stethoscope, Activity } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button, buttonClassNames } from "@/components/ui/button";
import type { ClinicalEncounterType } from "./types";

export interface ClinicalTimelineEncounterView {
  id: string;
  type: ClinicalEncounterType;
  /** Pre-formatted "HH:mm" — computed by the caller, not this component. */
  timeLabel?: string;
  practitionerName: string;
  /** Consultation-only motif preview. */
  reason?: string;
  /** Session-only: pre-formatted "Séance {{n}} / {{total}}". */
  sessionLabel?: string;
  treatmentTitle?: string;
  /** Present only when the session relates to a `TreatmentPlan` (§26) — renders "Voir le traitement". */
  treatmentHref?: string;
}

export interface ClinicalTimelineGroupView {
  /** Pre-formatted "23 août 2026" — computed by the caller. */
  dateLabel: string;
  encounters: ClinicalTimelineEncounterView[];
}

export interface ClinicalTimelineProps {
  groups: ClinicalTimelineGroupView[];
  onSelectConsultation: (id: string) => void;
}

/**
 * Restrained clinical-history timeline (Spec #9 Screen 18, UI-005B
 * §14-15) — a purpose-built domain component rather than a reuse of
 * `PatientActivityTimeline` (UI-004A): that component only renders
 * one-line translated activity strings and explicitly excludes clinical
 * note/diagnosis text, so it cannot represent structured motif/session
 * detail or the "Voir la consultation"/"Voir le traitement" interactions
 * this tab needs (documented in `frontend/ARCHITECTURE.md`). Takes only
 * pre-resolved display strings — no dependency on `features/*`
 * formatting/mock-data, matching `PatientActivityTimeline`'s own
 * convention.
 */
export function ClinicalTimeline({ groups, onSelectConsultation }: ClinicalTimelineProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.dateLabel} className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted" dir="ltr">
            {group.dateLabel}
          </p>
          <ul className="flex flex-col gap-2">
            {group.encounters.map((encounter) => (
              <li key={encounter.id}>
                <Card>
                  {encounter.type === "consultation" ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-text">
                        <Stethoscope className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                        {t("patientDetail.health.history.consultationLabel")}
                        {encounter.timeLabel && (
                          <span className="font-normal text-text-muted" dir="ltr">
                            · {encounter.timeLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted">{encounter.practitionerName}</p>
                      {encounter.reason && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                            {t("patientDetail.health.history.reasonLabel")}
                          </p>
                          <p className="text-sm text-text">{encounter.reason}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        onClick={() => onSelectConsultation(encounter.id)}
                      >
                        {t("patientDetail.health.history.viewConsultation")}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-text">
                        <Activity className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
                        {encounter.sessionLabel}
                        {encounter.timeLabel && (
                          <span className="font-normal text-text-muted" dir="ltr">
                            · {encounter.timeLabel}
                          </span>
                        )}
                      </div>
                      {encounter.treatmentTitle && <p className="text-sm text-text-muted">{encounter.treatmentTitle}</p>}
                      <p className="text-sm text-text-muted">{encounter.practitionerName}</p>
                      {encounter.treatmentHref && (
                        <Link href={encounter.treatmentHref} className={buttonClassNames("outline", "sm", "w-fit")}>
                          {t("patientDetail.treatments.viewTreatment")}
                        </Link>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
