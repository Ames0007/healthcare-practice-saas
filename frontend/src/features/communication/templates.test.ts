import { describe, expect, it } from "vitest";
import type { MessageTemplate } from "@/components/domain/communication/types";
import { buildInitialTemplateFormValues, buildTemplateFromFormValues, extractVariablesFromBody, renderTemplate, sortTemplatesByName } from "./templates";

describe("extractVariablesFromBody", () => {
  it("extracts known variables in canonical order, deduplicated", () => {
    const body = "{{patient_name}} ... {{appointment_date}} ... {{patient_name}} again";
    expect(extractVariablesFromBody(body)).toEqual(["patient_name", "appointment_date"]);
  });

  it("ignores unknown tokens", () => {
    expect(extractVariablesFromBody("Hello {{not_a_real_variable}}")).toEqual([]);
  });

  it("returns an empty array for plain text with no tokens", () => {
    expect(extractVariablesFromBody("Bonjour, ceci est un message fixe.")).toEqual([]);
  });
});

describe("renderTemplate", () => {
  it("substitutes known variables with their context value", () => {
    expect(renderTemplate("Bonjour {{patient_first_name}}", { patient_first_name: "Ahmed" })).toBe("Bonjour Ahmed");
  });

  it("renders a deterministic placeholder for a known variable missing from context", () => {
    expect(renderTemplate("Montant : {{amount_due}}", {})).toBe("Montant : —");
  });

  it("renders a deterministic placeholder rather than an empty string for a blank context value", () => {
    expect(renderTemplate("Bonjour {{patient_first_name}}", { patient_first_name: "  " })).toBe("Bonjour —");
  });

  it("leaves an unrecognized token untouched rather than interpreting it", () => {
    expect(renderTemplate("{{not_a_real_variable}}", {})).toBe("{{not_a_real_variable}}");
  });

  it("never evaluates the body as code — braces are treated as inert text", () => {
    const body = "{{patient_first_name}} <script>alert(1)</script>";
    expect(renderTemplate(body, { patient_first_name: "Ahmed" })).toBe("Ahmed <script>alert(1)</script>");
  });
});

describe("sortTemplatesByName", () => {
  it("sorts alphabetically and does not mutate the input", () => {
    const templates = [
      { id: "b", name: "Zèbre" } as MessageTemplate,
      { id: "a", name: "Alpha" } as MessageTemplate,
    ];
    const original = [...templates];

    const sorted = sortTemplatesByName(templates);

    expect(sorted.map((t) => t.id)).toEqual(["a", "b"]);
    expect(templates).toEqual(original);
  });
});

describe("buildInitialTemplateFormValues / buildTemplateFromFormValues", () => {
  it("produces sane defaults for a new template", () => {
    const values = buildInitialTemplateFormValues();
    expect(values.name).toBe("");
    expect(values.body).toBe("");
  });

  it("prefills from an existing template when editing", () => {
    const existing: MessageTemplate = {
      id: "tpl-1",
      name: "Rappel",
      purpose: "appointment_reminder",
      channel: "sms",
      locale: "ar",
      body: "{{patient_name}}",
      variables: ["patient_name"],
      active: true,
    };
    expect(buildInitialTemplateFormValues(existing)).toEqual({
      name: "Rappel",
      purpose: "appointment_reminder",
      channel: "sms",
      locale: "ar",
      body: "{{patient_name}}",
    });
  });

  it("creates a new template with derived variables and active defaulting to true", () => {
    const created = buildTemplateFromFormValues(
      { name: "Nouveau", purpose: "custom_operational", channel: "sms", locale: "fr", body: "Bonjour {{patient_first_name}}" },
      undefined,
      "tpl-99",
    );
    expect(created).toEqual({
      id: "tpl-99",
      name: "Nouveau",
      purpose: "custom_operational",
      channel: "sms",
      locale: "fr",
      body: "Bonjour {{patient_first_name}}",
      variables: ["patient_first_name"],
      active: true,
      updatedAt: undefined,
    });
  });

  it("preserves id/active/updatedAt when editing an existing template", () => {
    const existing: MessageTemplate = {
      id: "tpl-1",
      name: "Rappel",
      purpose: "appointment_reminder",
      channel: "sms",
      locale: "fr",
      body: "old",
      variables: [],
      active: false,
      updatedAt: "2026-01-01",
    };
    const updated = buildTemplateFromFormValues(
      { name: "Rappel modifié", purpose: "appointment_reminder", channel: "sms", locale: "fr", body: "{{patient_name}}" },
      existing,
      "tpl-1",
    );
    expect(updated.id).toBe("tpl-1");
    expect(updated.active).toBe(false);
    expect(updated.updatedAt).toBe("2026-01-01");
    expect(updated.variables).toEqual(["patient_name"]);
  });
});
