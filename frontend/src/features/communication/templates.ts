import type { CommunicationVariableKey, MessageTemplate, MessageTemplateFormValues } from "@/components/domain/communication/types";
import { COMMUNICATION_VARIABLE_ORDER } from "@/components/domain/communication/variable";

const VARIABLE_TOKEN_PATTERN = /\{\{(\w+)\}\}/g;

function isKnownVariableKey(key: string): key is CommunicationVariableKey {
  return (COMMUNICATION_VARIABLE_ORDER as string[]).includes(key);
}

/**
 * Derives `MessageTemplate.variables` from the body text itself (UI-009ABC
 * §27) rather than asking the editor to separately maintain a list — a
 * template's declared variables can never drift from what its own body
 * actually references. Unknown `{{tokens}}` are simply not collected (the
 * renderer leaves them untouched rather than guessing).
 */
export function extractVariablesFromBody(body: string): CommunicationVariableKey[] {
  const found = new Set<CommunicationVariableKey>();
  for (const match of body.matchAll(VARIABLE_TOKEN_PATTERN)) {
    if (isKnownVariableKey(match[1])) {
      found.add(match[1]);
    }
  }
  return COMMUNICATION_VARIABLE_ORDER.filter((key) => found.has(key));
}

export type TemplateRenderContext = Partial<Record<CommunicationVariableKey, string>>;

/** Deterministic "no value" marker (UI-009ABC §28) — never a blank string, which could silently read as valid content. */
export const MISSING_VARIABLE_PLACEHOLDER = "—";

/**
 * Pure template renderer (UI-009ABC §28): no `eval`, no
 * `dangerouslySetInnerHTML`, no arbitrary expression evaluation — only
 * literal substitution of known `{{tokens}}`. An unrecognized token is
 * left exactly as written (never interpreted, never silently dropped); a
 * known token missing from `context` renders as `MISSING_VARIABLE_PLACEHOLDER`
 * rather than an empty string that could read as real (but blank) content.
 */
export function renderTemplate(body: string, context: TemplateRenderContext): string {
  return body.replace(VARIABLE_TOKEN_PATTERN, (fullMatch, key: string) => {
    if (!isKnownVariableKey(key)) {
      return fullMatch;
    }
    const value = context[key];
    return value && value.trim() !== "" ? value : MISSING_VARIABLE_PLACEHOLDER;
  });
}

export function sortTemplatesByName(templates: MessageTemplate[]): MessageTemplate[] {
  return [...templates].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildInitialTemplateFormValues(template?: MessageTemplate): MessageTemplateFormValues {
  if (template) {
    return { name: template.name, purpose: template.purpose, channel: template.channel, locale: template.locale, body: template.body };
  }
  return { name: "", purpose: "appointment_reminder", channel: "whatsapp", locale: "fr", body: "" };
}

export function buildTemplateFromFormValues(values: MessageTemplateFormValues, existing: MessageTemplate | undefined, generatedId: string): MessageTemplate {
  return {
    id: existing?.id ?? generatedId,
    name: values.name,
    purpose: values.purpose,
    channel: values.channel,
    locale: values.locale,
    body: values.body,
    variables: extractVariablesFromBody(values.body),
    active: existing?.active ?? true,
    updatedAt: existing ? existing.updatedAt : undefined,
  };
}

export function generateNextTemplateId(templates: MessageTemplate[]): string {
  return `tpl-${templates.length + 1}`;
}

/** Fixed sample values for the editor's live APERÇU (Spec #9 Screen 42) — illustrative only, not tied to any real patient/appointment/invoice. */
export const SAMPLE_PREVIEW_CONTEXT: TemplateRenderContext = {
  patient_first_name: "Ahmed",
  patient_name: "Ahmed El Mansouri",
  appointment_date: "23 août 2026",
  appointment_time: "10:30",
  practitioner_name: "Dr. Benali",
  cabinet_name: "Cabinet (exemple)",
  invoice_number: "FAC-2026-00142",
  amount_due: "500 MAD",
  remaining_balance: "1 500 MAD",
  installment_due_date: "1 septembre 2026",
};
