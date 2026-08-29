"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Prescription } from "@/components/domain/clinical/types";
import { formatDayMonthYear, getPatientFullName } from "@/features/patients/format";
import { getPatientsMockData } from "@/features/patients/mock-data";
import { getCabinetProfileMockData } from "@/features/parametres/mock-cabinet-profile-data";
import { getDocumentSettingsMockData } from "@/features/parametres/mock-document-settings-data";
import { buildPrescriptionDocument } from "@/features/documents/prescription-document";
import { PrescriptionDocumentPdf } from "@/features/documents/prescription-document-pdf";
import { generateDocumentBlob, triggerBlobDownload, triggerBlobPrint } from "@/features/documents/download";
import { isDocumentLanguageSupported } from "@/features/documents/capabilities";

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
 * supports the concept (§31). "Télécharger PDF"/"Imprimer" generate a real
 * PDF from this exact `Prescription` (UI-DOCS-X) — this open drawer already
 * serves as the preview surface. `onFutureFeature` now only fires if
 * generation itself fails.
 */
export function PrescriptionDetailDrawer({
  prescription,
  associatedConsultationDate,
  open,
  onClose,
  onFutureFeature,
}: PrescriptionDetailDrawerProps) {
  const { t, locale } = useLocale();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!prescription) {
    return null;
  }

  const currentPrescription = prescription;

  async function generatePrescriptionBlob() {
    const patient = getPatientsMockData().find((candidate) => candidate.id === currentPrescription.patientId);
    const model = buildPrescriptionDocument(
      currentPrescription,
      patient ? getPatientFullName(patient) : "",
      patient?.patientNumber ?? "",
      getCabinetProfileMockData(),
      getDocumentSettingsMockData(),
    );
    const blob = await generateDocumentBlob(<PrescriptionDocumentPdf model={model} />);
    return { blob, filename: model.filename };
  }

  async function handleDownload() {
    if (!isDocumentLanguageSupported(getDocumentSettingsMockData().documentLanguage)) {
      onFutureFeature(t("documents.languageUnsupportedNotice"));
      return;
    }
    setIsDownloading(true);
    try {
      const { blob, filename } = await generatePrescriptionBlob();
      triggerBlobDownload(blob, filename);
    } catch {
      onFutureFeature(t("patientDetail.health.prescriptions.pdfNotice"));
    } finally {
      setIsDownloading(false);
    }
  }

  async function handlePrint() {
    if (!isDocumentLanguageSupported(getDocumentSettingsMockData().documentLanguage)) {
      onFutureFeature(t("documents.languageUnsupportedNotice"));
      return;
    }
    setIsPrinting(true);
    try {
      const { blob } = await generatePrescriptionBlob();
      triggerBlobPrint(blob);
    } catch {
      onFutureFeature(t("patientDetail.health.prescriptions.pdfNotice"));
    } finally {
      setIsPrinting(false);
    }
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
          <Button variant="outline" size="sm" onClick={handleDownload} loading={isDownloading}>
            {t("patientDetail.health.prescriptions.downloadPdf")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrint} loading={isPrinting}>
            {t("patientDetail.health.prescriptions.print")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
