"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import type { ClinicalEncounter, Prescription } from "@/components/domain/clinical/types";
import { getPrescriptionsMockData } from "@/features/patients/mock-prescriptions-data";
import { getPrescriptionsForPatient, sortPrescriptionsDesc } from "@/features/patients/prescriptions";
import { getClinicalEncountersMockData } from "@/features/patients/mock-clinical-encounters-data";
import { formatDayMonthYear } from "@/features/patients/format";
import { PrescriptionDetailDrawer } from "./prescription-detail-drawer";
import { PrescriptionFormDialog } from "./prescription-form-dialog";

export interface PrescriptionsSectionProps {
  patientId: string;
  practitionerId: string;
  practitionerName: string;
  /** Prototype seam for tests — defaults to the centralized mock prescriptions. */
  prescriptions?: Prescription[];
  /** Prototype seam for tests — defaults to UI-005B's centralized mock encounters, used only to resolve "Consultation associée" (§38), never mutated. */
  encounters?: ClinicalEncounter[];
}

/**
 * Prescriptions section (UI-005D §7/§25-37) — sits inside Dossier Santé,
 * below Documents, not reduced to a generic uploaded document (§42). A
 * newly created prescription lives only in this component's own local
 * state; the centralized fixtures are never mutated.
 */
export function PrescriptionsSection({
  patientId,
  practitionerId,
  practitionerName,
  prescriptions: providedPrescriptions,
  encounters: providedEncounters,
}: PrescriptionsSectionProps) {
  const { t, locale } = useLocale();
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [localPrescriptions, setLocalPrescriptions] = useState<Prescription[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const seedPrescriptions = getPrescriptionsForPatient(providedPrescriptions ?? getPrescriptionsMockData(), patientId);
  const allPrescriptions = sortPrescriptionsDesc([...seedPrescriptions, ...localPrescriptions]);
  const selectedPrescription = allPrescriptions.find((prescription) => prescription.id === selectedPrescriptionId) ?? null;

  const encounters = providedEncounters ?? getClinicalEncountersMockData();
  const associatedConsultationDate = selectedPrescription?.consultationId
    ? encounters.find((encounter) => encounter.id === selectedPrescription.consultationId)?.date
    : undefined;

  function handleCreated(prescription: Prescription) {
    setLocalPrescriptions((current) => [...current, prescription]);
    setFormOpen(false);
    setToastMessage(t("patientDetail.health.prescriptions.prescriptionCreated"));
    setSelectedPrescriptionId(prescription.id);
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("patientDetail.health.prescriptions.title")}
        </h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          {t("patientDetail.health.prescriptions.newButton")}
        </Button>
      </div>

      {allPrescriptions.length === 0 ? (
        <EmptyState
          title={t("patientDetail.health.prescriptions.emptyTitle")}
          description={t("patientDetail.health.prescriptions.emptyDescription")}
          primaryAction={
            <Button size="sm" onClick={() => setFormOpen(true)}>
              {t("patientDetail.health.prescriptions.emptyAction")}
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {allPrescriptions.map((prescription) => (
            <li key={prescription.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text" dir="ltr">
                    {prescription.prescriptionNumber}
                  </p>
                  <p className="text-xs text-text-muted">
                    <span dir="ltr">{formatDayMonthYear(prescription.issuedAt, locale)}</span> · {prescription.practitionerName}
                  </p>
                  <p className="text-xs text-text-muted">
                    {t("patientDetail.health.prescriptions.medicationCount", { count: prescription.items.length })}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedPrescriptionId(prescription.id)}>
                  {t("patientDetail.health.prescriptions.viewButton")}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <PrescriptionDetailDrawer
        prescription={selectedPrescription}
        associatedConsultationDate={associatedConsultationDate}
        open={selectedPrescription !== null}
        onClose={() => setSelectedPrescriptionId(null)}
        onFutureFeature={(message) => setToastMessage(message)}
      />
      <PrescriptionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        patientId={patientId}
        practitionerId={practitionerId}
        practitionerName={practitionerName}
        existingCount={allPrescriptions.length}
        onSuccess={handleCreated}
      />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
