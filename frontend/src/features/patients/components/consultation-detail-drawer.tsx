"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { ConsultationStructuredDetail } from "@/components/domain/clinical/consultation-structured-detail";
import { RelatedAppointmentNote } from "@/components/domain/clinical/related-appointment-note";
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
 * explicitly out of scope here. The four structured sections and the
 * "Rendez-vous associé" note are shared `components/domain/clinical/`
 * pieces, reused unchanged by UI-005C's completed-consultation view
 * (`ConsultationStructuredDetail`/`RelatedAppointmentNote`).
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

        <ConsultationStructuredDetail
          reason={encounter.reason}
          observations={encounter.observations}
          assessment={encounter.assessment}
          plan={encounter.plan}
        />

        {encounter.appointmentId && (
          <RelatedAppointmentNote
            appointmentId={encounter.appointmentId}
            href={`/app/patients/${patientId}/appointments`}
            className="border-t border-border pt-4"
          />
        )}
      </div>
    </Dialog>
  );
}
