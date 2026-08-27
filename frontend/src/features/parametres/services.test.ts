import { describe, expect, it } from "vitest";
import { getCabinetServicesMockData } from "./mock-cabinet-services-data";
import { buildInitialServiceFormValues, buildServiceFromFormValues, sortServicesByName, validateServiceForm } from "./services";

const MESSAGES = { required: "Ce champ est obligatoire.", invalidNumber: "Valeur invalide." };

describe("getCabinetServicesMockData", () => {
  it("names come verbatim from Agenda's own SERVICES catalog — never a disconnected new list", () => {
    const services = getCabinetServicesMockData();
    expect(services.map((service) => service.name)).toEqual([
      "Consultation",
      "Contrôle",
      "Détartrage",
      "Séance de kinésithérapie",
      "Suivi",
    ]);
  });

  it("reproduces the spec's own worked example exactly (Consultation — 400 MAD — 30 min)", () => {
    const consultation = getCabinetServicesMockData().find((service) => service.name === "Consultation")!;
    expect(consultation.price).toBe(400);
    expect(consultation.durationMinutes).toBe(30);
  });
});

describe("sortServicesByName", () => {
  it("sorts alphabetically, independent of fixture insertion order", () => {
    const sorted = sortServicesByName(getCabinetServicesMockData());
    const names = sorted.map((service) => service.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "fr")));
  });
});

describe("buildInitialServiceFormValues", () => {
  it("blank defaults for a new service", () => {
    const values = buildInitialServiceFormValues();
    expect(values).toEqual({ name: "", durationMinutes: "", price: "", schedulingMode: "exact", active: true });
  });

  it("mirrors an existing service's own fields as strings", () => {
    const service = getCabinetServicesMockData()[0];
    const values = buildInitialServiceFormValues(service);
    expect(values.name).toBe(service.name);
    expect(values.durationMinutes).toBe(String(service.durationMinutes));
    expect(values.price).toBe(String(service.price));
  });
});

describe("validateServiceForm", () => {
  const base = buildInitialServiceFormValues(getCabinetServicesMockData()[0]);

  it("passes with valid values", () => {
    expect(validateServiceForm(base, MESSAGES)).toEqual({});
  });

  it("requires a name", () => {
    expect(validateServiceForm({ ...base, name: "" }, MESSAGES).name).toBe(MESSAGES.required);
  });

  it("rejects a zero or negative duration", () => {
    expect(validateServiceForm({ ...base, durationMinutes: "0" }, MESSAGES).durationMinutes).toBe(MESSAGES.invalidNumber);
    expect(validateServiceForm({ ...base, durationMinutes: "-5" }, MESSAGES).durationMinutes).toBe(MESSAGES.invalidNumber);
  });

  it("rejects a non-numeric price but allows zero (a free service is valid)", () => {
    expect(validateServiceForm({ ...base, price: "abc" }, MESSAGES).price).toBe(MESSAGES.invalidNumber);
    expect(validateServiceForm({ ...base, price: "0" }, MESSAGES).price).toBeUndefined();
  });
});

describe("buildServiceFromFormValues", () => {
  it("preserves the existing id on edit", () => {
    const services = getCabinetServicesMockData();
    const existing = services[0];
    const values = { ...buildInitialServiceFormValues(existing), price: "500" };
    const updated = buildServiceFromFormValues(values, existing, services);
    expect(updated.id).toBe(existing.id);
    expect(updated.price).toBe(500);
  });

  it("generates a fresh sequential id on create, never colliding with an existing one", () => {
    const services = getCabinetServicesMockData();
    const values = { name: "Nouveau service", durationMinutes: "30", price: "300", schedulingMode: "exact" as const, active: true };
    const created = buildServiceFromFormValues(values, undefined, services);
    expect(services.some((service) => service.id === created.id)).toBe(false);
    expect(created.id).toBe("svc-6");
  });
});
