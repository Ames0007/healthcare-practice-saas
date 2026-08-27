import { describe, expect, it } from "vitest";
import { getMessageTemplatesMockData } from "./mock-templates-data";
import { getAutomationRulesMockData } from "./mock-automation-rules-data";
import { COMMUNICATION_CHANNEL_ORDER } from "@/components/domain/communication/channel";
import { COMMUNICATION_LOCALE_ORDER } from "@/components/domain/communication/locale";
import { COMMUNICATION_PURPOSE_ORDER } from "@/components/domain/communication/purpose";
import { COMMUNICATION_EVENT_TYPE_ORDER } from "@/components/domain/communication/event-type";

const templates = getMessageTemplatesMockData();
const rules = getAutomationRulesMockData();

describe("getMessageTemplatesMockData", () => {
  it("has unique ids", () => {
    const ids = templates.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses valid purpose/channel/locale values", () => {
    for (const template of templates) {
      expect(COMMUNICATION_PURPOSE_ORDER).toContain(template.purpose);
      expect(COMMUNICATION_CHANNEL_ORDER).toContain(template.channel);
      expect(COMMUNICATION_LOCALE_ORDER).toContain(template.locale);
    }
  });

  it("has variables that exactly match what the body actually references", () => {
    for (const template of templates) {
      const tokensInBody = [...template.body.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]);
      for (const variable of template.variables) {
        expect(tokensInBody).toContain(variable);
      }
    }
  });

  it("demonstrates at least one Arabic-locale template (Spec #9 Screen 42's own worked example)", () => {
    expect(templates.some((template) => template.locale === "ar")).toBe(true);
  });

  it("demonstrates at least one inactive template", () => {
    expect(templates.some((template) => !template.active)).toBe(true);
  });

  it("never carries clinical vocabulary in the body (administrative content only)", () => {
    const clinicalTerms = /diagnostic|allerg|ordonnance|prescription|pathologie/i;
    for (const template of templates) {
      expect(template.body).not.toMatch(clinicalTerms);
    }
  });
});

describe("getAutomationRulesMockData", () => {
  it("has unique ids and covers every canonical event type exactly once", () => {
    const ids = rules.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(rules.map((rule) => rule.eventType))).toEqual(new Set(COMMUNICATION_EVENT_TYPE_ORDER));
  });

  it("resolves every templateId against the existing Templates fixture, with a matching channel", () => {
    for (const rule of rules) {
      const template = templates.find((candidate) => candidate.id === rule.templateId);
      expect(template).toBeDefined();
      expect(template?.channel).toBe(rule.channel);
    }
  });

  it("demonstrates at least one inactive rule", () => {
    expect(rules.some((rule) => !rule.active)).toBe(true);
  });
});
