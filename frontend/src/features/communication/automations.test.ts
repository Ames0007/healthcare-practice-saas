import { describe, expect, it } from "vitest";
import type { AutomationRule, MessageTemplate } from "@/components/domain/communication/types";
import { resolveRuleTemplate, sortRulesByEventType, toggleRuleActive } from "./automations";

const templates: MessageTemplate[] = [
  { id: "tpl-1", name: "A", purpose: "appointment_confirmation", channel: "whatsapp", locale: "fr", body: "", variables: [], active: true },
];

describe("sortRulesByEventType", () => {
  it("orders rules by the canonical event-type order, not input order", () => {
    const rules: AutomationRule[] = [
      { id: "r1", eventType: "installment_overdue", channel: "sms", templateId: "tpl-1", active: true },
      { id: "r2", eventType: "appointment_confirmed", channel: "whatsapp", templateId: "tpl-1", active: true },
    ];
    expect(sortRulesByEventType(rules).map((rule) => rule.id)).toEqual(["r2", "r1"]);
  });

  it("does not mutate the input array", () => {
    const rules: AutomationRule[] = [
      { id: "r1", eventType: "installment_overdue", channel: "sms", templateId: "tpl-1", active: true },
      { id: "r2", eventType: "appointment_confirmed", channel: "whatsapp", templateId: "tpl-1", active: true },
    ];
    const original = [...rules];
    sortRulesByEventType(rules);
    expect(rules).toEqual(original);
  });
});

describe("resolveRuleTemplate", () => {
  it("resolves the linked template", () => {
    const rule: AutomationRule = { id: "r1", eventType: "appointment_confirmed", channel: "whatsapp", templateId: "tpl-1", active: true };
    expect(resolveRuleTemplate(rule, templates)).toEqual(templates[0]);
  });

  it("resolves to null for a dangling templateId", () => {
    const rule: AutomationRule = { id: "r1", eventType: "appointment_confirmed", channel: "whatsapp", templateId: "tpl-missing", active: true };
    expect(resolveRuleTemplate(rule, templates)).toBeNull();
  });
});

describe("toggleRuleActive", () => {
  it("flips only the targeted rule's active flag", () => {
    const rules: AutomationRule[] = [
      { id: "r1", eventType: "appointment_confirmed", channel: "whatsapp", templateId: "tpl-1", active: true },
      { id: "r2", eventType: "appointment_reminder", channel: "whatsapp", templateId: "tpl-1", active: false },
    ];
    const toggled = toggleRuleActive(rules, "r1");
    expect(toggled.find((r) => r.id === "r1")?.active).toBe(false);
    expect(toggled.find((r) => r.id === "r2")?.active).toBe(false);
  });

  it("does not mutate the input array", () => {
    const rules: AutomationRule[] = [{ id: "r1", eventType: "appointment_confirmed", channel: "whatsapp", templateId: "tpl-1", active: true }];
    const original = [...rules];
    toggleRuleActive(rules, "r1");
    expect(rules).toEqual(original);
  });
});
