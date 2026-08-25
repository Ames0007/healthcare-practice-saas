"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import type { ClinicalEncounter } from "@/components/domain/clinical/types";
import { formatDayMonthYear } from "@/features/patients/format";

export interface ConsultationDetailDrawerProps {
  encounter: ClinicalEncounter | null;
  patientId: string;
  patientName: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Read-only historical consultation detail (Spec #9 Screen 18/20, UI-005B
 * §19-22). No Modifier/Supprimer/Réouvrir action anywhere — a completed
 * historical clinical record is not ordinary CRUD (CLAUDE.md §24); future
 * correction governance is a separate, unimplemented concern. Consultation
 * creation/editing (UI-005C) and prescriptions/documents (UI-005D) are
 * explicitly out of scope here.
 */
export function ConsultationDetailDrawer({ encounter, patientId, patientName, open, onClose }: ConsultationDetailDrawerProps) {
  const { t, locale } = useLocale();

  if (!encounter) {
    return null;
  }

  const heading = t("patientDetail.health.history.consultationLabel");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={heading} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-text">{heading}</h2>
          <p className="text-sm text-text" dir="ltr">
            {formatDayMonthYear(encounter.date, locale)}
            {encounter.time && ` · ${encounter.time}`}
          </p>
          <p className="text-sm text-text-muted">{encounter.practitionerName}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("patientDetail.invoices.patientLabel")}</p>
          <p className="text-sm text-text">{patientName}</p>
        </div>

        {encounter.reason && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.history.reasonLabel")}
            </p>
            <p className="text-sm text-text">{encounter.reason}</p>
          </div>
        )}

        {encounter.observations && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.history.observationsLabel")}
            </p>
            <p className="text-sm text-text">{encounter.observations}</p>
          </div>
        )}

        {encounter.assessment && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.history.assessmentLabel")}
            </p>
            <p className="text-sm text-text">{encounter.assessment}</p>
          </div>
        )}

        {encounter.plan && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.history.planLabel")}
            </p>
            <p className="text-sm text-text">{encounter.plan}</p>
          </div>
        )}

        {encounter.appointmentId && (
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.history.relatedAppointmentLabel")}
            </p>
            <p className="text-sm text-text" dir="ltr">
              {encounter.appointmentId}
            </p>
            <Link
              href={`/app/patients/${patientId}/appointments`}
              className="mt-1 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("patientDetail.health.history.viewAppointment")}
            </Link>
          </div>
        )}
      </div>
    </Dialog>
  );
}
