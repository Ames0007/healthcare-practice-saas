import type { AutomationRule, MessageTemplate } from "@/components/domain/communication/types";
import { COMMUNICATION_EVENT_TYPE_ORDER } from "@/components/domain/communication/event-type";

export function sortRulesByEventType(rules: AutomationRule[]): AutomationRule[] {
  return [...rules].sort((a, b) => COMMUNICATION_EVENT_TYPE_ORDER.indexOf(a.eventType) - COMMUNICATION_EVENT_TYPE_ORDER.indexOf(b.eventType));
}

export function resolveRuleTemplate(rule: AutomationRule, templates: MessageTemplate[]): MessageTemplate | null {
  return templates.find((template) => template.id === rule.templateId) ?? null;
}

/**
 * Immutable toggle (UI-009ABC §11: "Owner can configure whether each
 * automation is active" is the only editable field in this bounded
 * prototype — mirrors the local-state-only pattern every other prototype
 * interaction in this codebase uses, no persistence).
 */
export function toggleRuleActive(rules: AutomationRule[], ruleId: string): AutomationRule[] {
  return rules.map((rule) => (rule.id === ruleId ? { ...rule, active: !rule.active } : rule));
}
