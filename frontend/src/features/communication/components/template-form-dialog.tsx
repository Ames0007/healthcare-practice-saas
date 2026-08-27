"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNICATION_CHANNEL_MAP, COMMUNICATION_CHANNEL_ORDER } from "@/components/domain/communication/channel";
import { COMMUNICATION_LOCALE_MAP, COMMUNICATION_LOCALE_ORDER } from "@/components/domain/communication/locale";
import { COMMUNICATION_PURPOSE_MAP, COMMUNICATION_PURPOSE_ORDER } from "@/components/domain/communication/purpose";
import { COMMUNICATION_VARIABLE_MAP, COMMUNICATION_VARIABLE_ORDER } from "@/components/domain/communication/variable";
import type { CommunicationChannel, CommunicationLocale, CommunicationPurpose, MessageTemplateFormValues } from "@/components/domain/communication/types";
import { SAMPLE_PREVIEW_CONTEXT, renderTemplate } from "@/features/communication/templates";

export interface TemplateFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: MessageTemplateFormValues) => void;
  initialValues: MessageTemplateFormValues;
  /** Read-only display context, present only when editing an existing template. */
  isEdit?: boolean;
}

/**
 * Bounded add/edit template prototype (Spec #9 Screen 42, UI-009ABC §29) —
 * mirrors `ItemFormDialog`'s exact validate/submit shape. The APERÇU
 * section is a live, read-only rendering of the body against a fixed
 * sample context (`SAMPLE_PREVIEW_CONTEXT`) via the same pure
 * `renderTemplate` function the rest of the module uses — never
 * `dangerouslySetInnerHTML`, plain text interpolation only.
 */
export function TemplateFormDialog({ open, onClose, onSubmit, initialValues, isEdit = false }: TemplateFormDialogProps) {
  const { t } = useLocale();

  const [name, setName] = useState(initialValues.name);
  const [purpose, setPurpose] = useState<CommunicationPurpose>(initialValues.purpose);
  const [channel, setChannel] = useState<CommunicationChannel>(initialValues.channel);
  const [locale, setLocale] = useState<CommunicationLocale>(initialValues.locale);
  const [body, setBody] = useState(initialValues.body);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function buildValues(): MessageTemplateFormValues {
    return { name: name.trim(), purpose, channel, locale, body: body.trim() };
  }

  function validate(values: MessageTemplateFormValues): Record<string, string> {
    const required = t("communication.templates.form.requiredError");
    const nextErrors: Record<string, string> = {};
    if (!values.name) nextErrors.name = required;
    if (!values.body) nextErrors.body = required;
    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const values = buildValues();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    onSubmit(values);
  }

  const title = t(isEdit ? "communication.templates.form.editTitle" : "communication.templates.form.addTitle");
  const preview = renderTemplate(body, SAMPLE_PREVIEW_CONTEXT);

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("communication.templates.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-text">{title}</h2>

        <Input label={t("communication.templates.form.nameLabel")} required value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />

        <Select
          label={t("communication.templates.form.purposeLabel")}
          required
          value={purpose}
          onChange={(event) => setPurpose(event.target.value as CommunicationPurpose)}
          options={COMMUNICATION_PURPOSE_ORDER.map((option) => ({ value: option, label: t(COMMUNICATION_PURPOSE_MAP[option].translationKey) }))}
        />

        <Select
          label={t("communication.templates.form.channelLabel")}
          required
          value={channel}
          onChange={(event) => setChannel(event.target.value as CommunicationChannel)}
          options={COMMUNICATION_CHANNEL_ORDER.map((option) => ({ value: option, label: t(COMMUNICATION_CHANNEL_MAP[option].translationKey) }))}
        />

        <Select
          label={t("communication.templates.form.localeLabel")}
          required
          value={locale}
          onChange={(event) => setLocale(event.target.value as CommunicationLocale)}
          options={COMMUNICATION_LOCALE_ORDER.map((option) => ({ value: option, label: t(COMMUNICATION_LOCALE_MAP[option].translationKey) }))}
        />

        <Textarea label={t("communication.templates.form.bodyLabel")} required rows={4} value={body} onChange={(event) => setBody(event.target.value)} error={errors.body} />

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.templates.form.variablesTitle")}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {COMMUNICATION_VARIABLE_ORDER.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setBody((current) => `${current}${COMMUNICATION_VARIABLE_MAP[key].token}`)}
                  className="rounded-md border border-border bg-surface-subtle px-2 py-1 text-xs font-mono text-text-secondary hover:bg-surface"
                  title={t(COMMUNICATION_VARIABLE_MAP[key].translationKey)}
                >
                  {COMMUNICATION_VARIABLE_MAP[key].token}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("communication.templates.form.previewTitle")}</p>
          <p className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-surface-subtle p-3 text-sm text-text">
            {preview || t("communication.templates.form.previewEmpty")}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("communication.templates.form.cancel")}
          </Button>
          <Button type="submit">{t("communication.templates.form.save")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
