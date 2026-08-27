import type { AutomationRule } from "@/components/domain/communication/types";

/**
 * Centralized synthetic automation-rule fixtures (UI-009ABC §10) — one
 * fixed row per `CommunicationEventType` (Spec #2 §40's own 7-bullet V1
 * rule list), each referencing a real, channel-matching template from
 * `mock-templates-data.ts`. `rule-7` is deliberately inactive, and points
 * at the one deliberately inactive template (tpl-8) — proving the
 * "inactive automation, inactive template" combination stays coherent.
 */
export function getAutomationRulesMockData(): AutomationRule[] {
  return [
    { id: "rule-1", eventType: "appointment_confirmed", channel: "whatsapp", templateId: "tpl-1", active: true },
    { id: "rule-2", eventType: "appointment_reminder", channel: "whatsapp", templateId: "tpl-2", timingOffsetMinutes: 1440, active: true },
    { id: "rule-3", eventType: "appointment_modified", channel: "whatsapp", templateId: "tpl-4", active: true },
    { id: "rule-4", eventType: "appointment_cancelled", channel: "sms", templateId: "tpl-5", active: true },
    { id: "rule-5", eventType: "payment_recorded", channel: "sms", templateId: "tpl-6", active: true },
    { id: "rule-6", eventType: "installment_due", channel: "whatsapp", templateId: "tpl-7", timingOffsetMinutes: 2880, active: true },
    { id: "rule-7", eventType: "installment_overdue", channel: "sms", templateId: "tpl-8", active: false },
  ];
}
