"use client";

import { useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Prescription } from "@/components/domain/clinical/types";
import { PATIENTS_TODAY_DATE } from "@/features/patients/mock-data";
import { generatePrescriptionNumber } from "@/features/patients/prescriptions";

interface ItemDraft {
  key: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface ItemFieldErrors {
  medication?: string;
  dosage?: string;
  frequency?: string;
}

function makeEmptyItem(key: string): ItemDraft {
  return { key, medication: "", dosage: "", frequency: "", duration: "", instructions: "" };
}

export interface PrescriptionFormDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  practitionerId: string;
  practitionerName: string;
  existingCount: number;
  onSuccess: (prescription: Prescription) => void;
}

/**
 * Structured "Nouvelle ordonnance" prototype form (Spec's own structured-
 * form guidance, UI-005D §32-36). Medication/dosage/frequency/duration/
 * instructions are practitioner-entered free text only — no drug
 * database, no autocomplete, no dosage/interaction/contraindication
 * checking anywhere (§27). Validates form completeness only, never
 * medical correctness (§35).
 */
export function PrescriptionFormDialog({
  open,
  onClose,
  patientId,
  practitionerId,
  practitionerName,
  existingCount,
  onSuccess,
}: PrescriptionFormDialogProps) {
  const { t } = useLocale();
  const nextItemKeyRef = useRef(2);
  const [items, setItems] = useState<ItemDraft[]>([makeEmptyItem("item-1")]);
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [itemErrors, setItemErrors] = useState<Record<string, ItemFieldErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleItemChange(key: string, field: keyof Omit<ItemDraft, "key">, value: string) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, [field]: value } : item)));
  }

  function handleAddItem() {
    const key = `item-${nextItemKeyRef.current}`;
    nextItemKeyRef.current += 1;
    setItems((current) => [...current, makeEmptyItem(key)]);
    setFormError(null);
  }

  function handleRemoveItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
    setItemErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function validate(): { itemErrors: Record<string, ItemFieldErrors>; formError: string | null } {
    if (items.length === 0) {
      return { itemErrors: {}, formError: t("patientDetail.health.prescriptions.form.noItemsError") };
    }

    const nextItemErrors: Record<string, ItemFieldErrors> = {};
    items.forEach((item) => {
      const errors: ItemFieldErrors = {};
      if (!item.medication.trim()) {
        errors.medication = t("patientDetail.health.prescriptions.form.medicationRequiredError");
      }
      if (!item.dosage.trim()) {
        errors.dosage = t("patientDetail.health.prescriptions.form.dosageRequiredError");
      }
      if (!item.frequency.trim()) {
        errors.frequency = t("patientDetail.health.prescriptions.form.frequencyRequiredError");
      }
      if (Object.keys(errors).length > 0) {
        nextItemErrors[item.key] = errors;
      }
    });

    return { itemErrors: nextItemErrors, formError: null };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const { itemErrors: nextItemErrors, formError: nextFormError } = validate();
    setItemErrors(nextItemErrors);
    setFormError(nextFormError);
    if (nextFormError || Object.keys(nextItemErrors).length > 0) {
      return;
    }

    const prescriptionId = `presc-new-${existingCount + 1}`;
    const prescription: Prescription = {
      id: prescriptionId,
      prescriptionNumber: generatePrescriptionNumber(existingCount),
      patientId,
      practitionerId,
      practitionerName,
      issuedAt: PATIENTS_TODAY_DATE,
      status: "issued",
      items: items.map((item, index) => ({
        id: `${prescriptionId}-item-${index + 1}`,
        medication: item.medication.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),
        duration: item.duration.trim() || undefined,
        instructions: item.instructions.trim() || undefined,
      })),
      instructions: generalInstructions.trim() || undefined,
    };

    onSuccess(prescription);
  }

  const title = t("patientDetail.health.prescriptions.formTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("agenda.drawer.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title}</h2>

        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div key={item.key} className="flex flex-col gap-3 rounded-md border border-border p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
                  {t("patientDetail.health.prescriptions.form.medicationHeading", { n: index + 1 })}
                </h3>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.key)}
                  aria-label={t("patientDetail.health.prescriptions.form.removeMedication", { n: index + 1 })}
                  className="text-text-muted hover:text-danger"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <Input
                label={t("patientDetail.health.prescriptions.form.medicationLabel")}
                required
                value={item.medication}
                onChange={(event) => handleItemChange(item.key, "medication", event.target.value)}
                error={itemErrors[item.key]?.medication}
              />
              <Input
                label={t("patientDetail.health.prescriptions.form.dosageLabel")}
                required
                value={item.dosage}
                onChange={(event) => handleItemChange(item.key, "dosage", event.target.value)}
                error={itemErrors[item.key]?.dosage}
              />
              <Input
                label={t("patientDetail.health.prescriptions.form.frequencyLabel")}
                required
                value={item.frequency}
                onChange={(event) => handleItemChange(item.key, "frequency", event.target.value)}
                error={itemErrors[item.key]?.frequency}
              />
              <Input
                label={t("patientDetail.health.prescriptions.form.durationLabel")}
                value={item.duration}
                onChange={(event) => handleItemChange(item.key, "duration", event.target.value)}
              />
              <Textarea
                label={t("patientDetail.health.prescriptions.form.instructionsLabel")}
                value={item.instructions}
                onChange={(event) => handleItemChange(item.key, "instructions", event.target.value)}
              />
            </div>
          ))}
        </div>

        {formError && <p className="text-sm text-danger">{formError}</p>}

        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={handleAddItem}>
          {t("patientDetail.health.prescriptions.form.addMedication")}
        </Button>

        <Textarea
          label={t("patientDetail.health.prescriptions.form.generalInstructionsLabel")}
          value={generalInstructions}
          onChange={(event) => setGeneralInstructions(event.target.value)}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t("patientDetail.health.prescriptions.form.cancel")}
          </Button>
          <Button type="submit" size="sm">
            {t("patientDetail.health.prescriptions.form.submit")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
