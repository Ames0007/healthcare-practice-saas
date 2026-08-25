"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Prescription } from "@/components/domain/clinical/types";
import { formatDayMonthYear } from "@/features/patients/format";

export interface PrescriptionDetailDrawerProps {
  prescription: Prescription | null;
  /** Pre-resolved ISO date of the associated `ClinicalEncounter` (UI-005B), when the prescription originated from one — resolved by the caller, never mutating that consultation record (§38). */
  associatedConsultationDate?: string;
  open: boolean;
  onClose: () => void;
  onFutureFeature: (message: string) => void;
}

/**
 * Read-only prescription detail (Spec #9-style drawer, UI-005D §30-31).
 * No Modifier/Supprimer anywhere — an issued prescription is not ordinary
 * CRUD; no cancellation workflow is implemented even though the model
 * supports the concept (§31). "Télécharger PDF"/"Imprimer" are prototype
 * affordances only — no real document is generated (§40).
 */
export function PrescriptionDetailDrawer({
  prescription,
  associatedConsultationDate,
  open,
  onClose,
  onFutureFeature,
}: PrescriptionDetailDrawerProps) {
  const { t, locale } = useLocale();

  if (!prescription) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={prescription.prescriptionNumber} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-text" dir="ltr">
            {prescription.prescriptionNumber}
          </h2>
          <p className="text-sm text-text" dir="ltr">
            {formatDayMonthYear(prescription.issuedAt, locale)}
          </p>
          <p className="text-sm text-text-muted">{prescription.practitionerName}</p>
        </div>

        {associatedConsultationDate && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.prescriptions.associatedConsultationLabel")}
            </p>
            <p className="text-sm text-text" dir="ltr">
              {formatDayMonthYear(associatedConsultationDate, locale)}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t("patientDetail.health.prescriptions.medicationsHeading")}
          </h3>
          <ul className="mt-2 flex flex-col gap-3">
            {prescription.items.map((item) => (
              <li key={item.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium text-text">{item.medication}</p>
                <p className="text-sm text-text-muted">
                  {t("patientDetail.health.prescriptions.dosageLabel")}: {item.dosage}
                </p>
                <p className="text-sm text-text-muted">
                  {t("patientDetail.health.prescriptions.frequencyLabel")}: {item.frequency}
                </p>
                {item.duration && (
                  <p className="text-sm text-text-muted">
                    {t("patientDetail.health.prescriptions.durationLabel")}: {item.duration}
                  </p>
                )}
                {item.instructions && <p className="mt-1 text-sm text-text">{item.instructions}</p>}
              </li>
            ))}
          </ul>
        </div>

        {prescription.instructions && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              {t("patientDetail.health.prescriptions.generalInstructionsLabel")}
            </p>
            <p className="text-sm text-text">{prescription.instructions}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={() => onFutureFeature(t("patientDetail.health.prescriptions.pdfNotice"))}>
            {t("patientDetail.health.prescriptions.downloadPdf")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onFutureFeature(t("patientDetail.health.prescriptions.pdfNotice"))}>
            {t("patientDetail.health.prescriptions.print")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
