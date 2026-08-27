"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNICATION_CHANNEL_MAP, COMMUNICATION_CHANNEL_ORDER } from "@/components/domain/communication/channel";
import type { CommunicationChannel, MessageTemplate } from "@/components/domain/communication/types";
import type { Patient } from "@/features/patients/types";
import { getPatientFullName } from "@/features/patients/format";
import { applyTemplateToSendMessageForm, type SendMessageFormValues } from "@/features/communication/operations";

export interface SendMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SendMessageFormValues) => void;
  initialValues: SendMessageFormValues;
  patients: Patient[];
  /** Only active templates are offered — an inactive template should not be used to compose a new send. */
  templates: MessageTemplate[];
  cabinetName: string;
}

/**
 * Bounded "Send Message" prototype (UI-009ABC §15) — composes exactly one
 * message to one existing patient. No queue, no provider call: submitting
 * records a local "sent" message via `buildSentMessage` (mirrors every
 * other Add-dialog's local-state-only pattern). Selecting a template
 * fills channel/body from `renderTemplate` against the selected patient's
 * real data; the body stays freely editable afterward.
 */
export function SendMessageDialog({ open, onClose, onSubmit, initialValues, patients, templates, cabinetName }: SendMessageDialogProps) {
  const { t } = useLocale();

  const [patientId, setPatientId] = useState(initialValues.patientId);
  const [templateId, setTemplateId] = useState(initialValues.templateId);
  const [channel, setChannel] = useState<CommunicationChannel>(initialValues.channel);
  const [body, setBody] = useState(initialValues.body);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeTemplates = templates.filter((template) => template.active);
  const selectedPatient = patients.find((patient) => patient.id === patientId) ?? null;

  function handleTemplateChange(nextTemplateId: string) {
    setTemplateId(nextTemplateId);
    const template = activeTemplates.find((candidate) => candidate.id === nextTemplateId);
    if (!template) {
      return;
    }
    const applied = applyTemplateToSendMessageForm({ patientId, templateId, channel, body }, template, selectedPatient, cabinetName);
    setChannel(applied.channel);
    setBody(applied.body);
  }

  function validate(): Record<string, string> {
    const required = t("communication.dashboard.sendForm.requiredError");
    const nextErrors: Record<string, string> = {};
    if (!patientId) nextErrors.patientId = required;
    if (!body.trim()) nextErrors.body = required;
    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit({ patientId, templateId, channel, body: body.trim() });
  }

  const title = t("communication.dashboard.sendForm.title");
  const patientItems = patients.map((patient) => ({ id: patient.id, label: getPatientFullName(patient), description: patient.patientNumber }));

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("communication.dashboard.sendForm.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title}</h2>

        <Combobox
          label={t("communication.dashboard.sendForm.patientLabel")}
          required
          value={patientId || null}
          onChange={setPatientId}
          items={patientItems}
          emptyMessage={t("communication.dashboard.sendForm.patientEmpty")}
          error={errors.patientId}
        />

        <Select
          label={t("communication.dashboard.sendForm.templateLabel")}
          value={templateId}
          onChange={(event) => handleTemplateChange(event.target.value)}
          placeholder={t("communication.dashboard.sendForm.templatePlaceholder")}
          options={activeTemplates.map((template) => ({ value: template.id, label: template.name }))}
        />

        <Select
          label={t("communication.dashboard.sendForm.channelLabel")}
          required
          value={channel}
          onChange={(event) => setChannel(event.target.value as CommunicationChannel)}
          options={COMMUNICATION_CHANNEL_ORDER.map((option) => ({ value: option, label: t(COMMUNICATION_CHANNEL_MAP[option].translationKey) }))}
        />

        <Textarea
          label={t("communication.dashboard.sendForm.bodyLabel")}
          required
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          error={errors.body}
        />

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("communication.dashboard.sendForm.cancel")}
          </Button>
          <Button type="submit">{t("communication.dashboard.sendForm.send")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
