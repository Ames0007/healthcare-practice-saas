import type { Prescription } from "@/components/domain/clinical/types";
import type { CabinetProfile, DocumentSettings } from "@/components/domain/settings/types";
import { formatDayMonthYear } from "@/features/patients/format";
import { buildDocumentFilename } from "./filename";
import { createDocumentTranslator } from "./translate";
import type { GeneratedDocumentBase } from "./types";

export interface PrescriptionDocumentItem {
  id: string;
  medication: string;
  dosageLabel: string;
  dosage: string;
  frequencyLabel: string;
  frequency: string;
  durationLabel?: string;
  duration?: string;
  instructions?: string;
}

export interface PrescriptionDocumentModel extends GeneratedDocumentBase {
  type: "prescription";
  dateLabel: string;
  dateValue: string;
  patientLabel: string;
  patientName: string;
  patientNumberLabel: string;
  patientNumber: string;
  practitionerLabel: string;
  practitionerName: string;
  medicationsHeading: string;
  items: PrescriptionDocumentItem[];
  instructionsLabel: string;
  generalInstructions?: string;
  prototypeNotice: string;
}

/**
 * Pure prescription → document projection (task §20-22). Renders ONLY
 * `Prescription` fields — no allergy/history/finance/social-coverage data
 * ever crosses into this model, even though those fixtures exist elsewhere
 * on the patient (§22). The practitioner-entered medication/dosage/
 * frequency/instructions text is rendered verbatim, never altered,
 * inferred, or supplemented (§21).
 */
export function buildPrescriptionDocument(
  prescription: Prescription,
  patientName: string,
  patientNumber: string,
  cabinet: CabinetProfile,
  documentSettings: DocumentSettings,
): PrescriptionDocumentModel {
  const locale = documentSettings.documentLanguage;
  const t = createDocumentTranslator(locale);
  const issuedDateOnly = prescription.issuedAt.slice(0, 10);

  return {
    type: "prescription",
    reference: prescription.prescriptionNumber,
    title: t("documents.prescription.title"),
    filename: buildDocumentFilename("Ordonnance", patientNumber, issuedDateOnly),
    locale,
    generatedAtPrototype: new Date().toISOString(),
    sourceRecordId: prescription.id,
    cabinet: {
      name: cabinet.name,
      address: cabinet.address,
      city: cabinet.city,
      phone: cabinet.phone,
      email: cabinet.email,
    },
    headerNote: documentSettings.headerNote,
    footerText: documentSettings.footerText,
    dateLabel: t("documents.prescription.dateLabel"),
    dateValue: formatDayMonthYear(issuedDateOnly, locale),
    patientLabel: t("documents.prescription.patientLabel"),
    patientName,
    patientNumberLabel: t("documents.prescription.patientNumberLabel"),
    patientNumber,
    practitionerLabel: t("documents.prescription.practitionerLabel"),
    practitionerName: prescription.practitionerName,
    medicationsHeading: t("documents.prescription.medicationsHeading"),
    items: prescription.items.map((item) => ({
      id: item.id,
      medication: item.medication,
      dosageLabel: t("documents.prescription.dosageLabel"),
      dosage: item.dosage,
      frequencyLabel: t("documents.prescription.frequencyLabel"),
      frequency: item.frequency,
      durationLabel: item.duration ? t("documents.prescription.durationLabel") : undefined,
      duration: item.duration,
      instructions: item.instructions,
    })),
    instructionsLabel: t("documents.prescription.instructionsLabel"),
    generalInstructions: prescription.instructions,
    prototypeNotice: t("documents.prototypeNotice"),
  };
}
