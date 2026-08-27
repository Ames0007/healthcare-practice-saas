import { describe, expect, it } from "vitest";
import { getCabinetProfileMockData } from "./mock-cabinet-profile-data";
import { applyCabinetSettingsUpdate, buildInitialCabinetSettingsFormValues, validateCabinetSettingsForm } from "./cabinet-settings";

const MESSAGES = { required: "Ce champ est obligatoire.", invalidPhone: "Numéro invalide.", invalidEmail: "Email invalide." };

describe("buildInitialCabinetSettingsFormValues", () => {
  it("mirrors the current profile's own fields exactly, with undefined optionals becoming empty strings", () => {
    const profile = getCabinetProfileMockData();
    const values = buildInitialCabinetSettingsFormValues(profile);
    expect(values.name).toBe(profile.name);
    expect(values.phone).toBe(profile.phone);
    expect(values.address).toBe(profile.address);
    expect(values.city).toBe(profile.city);
    expect(values.email).toBe(profile.email);
  });

  it("empty optionals become empty strings, never 'undefined' as literal text", () => {
    const profile = getCabinetProfileMockData();
    const values = buildInitialCabinetSettingsFormValues({ ...profile, address: undefined, city: undefined, email: undefined });
    expect(values.address).toBe("");
    expect(values.city).toBe("");
    expect(values.email).toBe("");
  });
});

describe("validateCabinetSettingsForm", () => {
  const base = buildInitialCabinetSettingsFormValues(getCabinetProfileMockData());

  it("passes with the fixture's own valid values", () => {
    expect(validateCabinetSettingsForm(base, MESSAGES)).toEqual({});
  });

  it("requires name and phone", () => {
    const errors = validateCabinetSettingsForm({ ...base, name: "", phone: "" }, MESSAGES);
    expect(errors.name).toBe(MESSAGES.required);
    expect(errors.phone).toBe(MESSAGES.required);
  });

  it("rejects a phone number that is too short", () => {
    const errors = validateCabinetSettingsForm({ ...base, phone: "0612" }, MESSAGES);
    expect(errors.phone).toBe(MESSAGES.invalidPhone);
  });

  it("rejects a malformed email but allows an empty one (optional field)", () => {
    expect(validateCabinetSettingsForm({ ...base, email: "not-an-email" }, MESSAGES).email).toBe(MESSAGES.invalidEmail);
    expect(validateCabinetSettingsForm({ ...base, email: "" }, MESSAGES).email).toBeUndefined();
  });
});

describe("applyCabinetSettingsUpdate", () => {
  it("applies every editable field and preserves currencyCode/timezone unchanged", () => {
    const profile = getCabinetProfileMockData();
    const values = { ...buildInitialCabinetSettingsFormValues(profile), name: "Nouveau nom du cabinet", city: "Rabat" };
    const updated = applyCabinetSettingsUpdate(profile, values);

    expect(updated.name).toBe("Nouveau nom du cabinet");
    expect(updated.city).toBe("Rabat");
    expect(updated.currencyCode).toBe("MAD");
    expect(updated.timezone).toBe(profile.timezone);
  });

  it("blank optional fields become undefined, not empty strings (mirrors the domain type's own optionality)", () => {
    const profile = getCabinetProfileMockData();
    const values = { ...buildInitialCabinetSettingsFormValues(profile), address: "", city: "", email: "" };
    const updated = applyCabinetSettingsUpdate(profile, values);

    expect(updated.address).toBeUndefined();
    expect(updated.city).toBeUndefined();
    expect(updated.email).toBeUndefined();
  });
});
