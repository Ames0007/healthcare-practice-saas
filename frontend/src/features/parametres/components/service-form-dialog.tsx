"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AppointmentSchedulingType } from "@/components/domain/appointments/types";
import type { CabinetServiceFormValues } from "@/components/domain/settings/types";
import { validateServiceForm } from "../services";

export interface ServiceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CabinetServiceFormValues) => void;
  initialValues: CabinetServiceFormValues;
  isEdit?: boolean;
}

const SCHEDULING_MODE_ORDER: AppointmentSchedulingType[] = ["exact", "window"];

/**
 * Bounded add/edit service prototype (Spec #9 Screen 45, UI-010ABC §15) —
 * mirrors `TemplateFormDialog`'s exact validate/submit shape. Callers must
 * conditionally-render the Edit instance with a `key={service.id}` when
 * switching edit targets — the same stale-`useState` bug UI-009ABC's own
 * `TemplateFormDialog` already documented and fixed (a persistent single
 * instance across different edit targets does not re-run its initial
 * `useState` values on prop change alone).
 */
export function ServiceFormDialog({ open, onClose, onSubmit, initialValues, isEdit = false }: ServiceFormDialogProps) {
  const { t } = useLocale();

  const [name, setName] = useState(initialValues.name);
  const [durationMinutes, setDurationMinutes] = useState(initialValues.durationMinutes);
  const [price, setPrice] = useState(initialValues.price);
  const [schedulingMode, setSchedulingMode] = useState<AppointmentSchedulingType>(initialValues.schedulingMode);
  const [active, setActive] = useState(initialValues.active);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function buildValues(): CabinetServiceFormValues {
    return { name: name.trim(), durationMinutes, price, schedulingMode, active };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const values = buildValues();
    const nextErrors = validateServiceForm(values, {
      required: t("parametres.services.form.requiredError"),
      invalidNumber: t("parametres.services.form.invalidNumberError"),
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit(values);
  }

  const title = t(isEdit ? "parametres.services.form.editTitle" : "parametres.services.form.addTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("parametres.services.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title}</h2>

        <Input label={t("parametres.services.form.nameLabel")} required value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />

        <Input
          label={t("parametres.services.form.durationLabel")}
          required
          type="number"
          min={1}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(event.target.value)}
          error={errors.durationMinutes}
        />

        <Input
          label={t("parametres.services.form.priceLabel")}
          required
          type="number"
          min={0}
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          error={errors.price}
        />

        <Select
          label={t("parametres.services.form.schedulingModeLabel")}
          required
          value={schedulingMode}
          onChange={(event) => setSchedulingMode(event.target.value as AppointmentSchedulingType)}
          options={SCHEDULING_MODE_ORDER.map((mode) => ({ value: mode, label: t(`parametres.services.schedulingMode.${mode}`) }))}
        />

        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 rounded border-border-strong" />
          {t("parametres.services.form.activeLabel")}
        </label>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("parametres.services.form.cancel")}
          </Button>
          <Button type="submit">{t("parametres.services.form.save")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
