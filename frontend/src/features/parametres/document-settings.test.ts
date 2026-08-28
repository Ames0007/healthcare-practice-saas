import { describe, expect, it } from "vitest";
import { getCabinetProfileMockData } from "./mock-cabinet-profile-data";
import { getDocumentSettingsMockData } from "./mock-document-settings-data";
import {
  applyDocumentSettingsUpdate,
  buildDefaultDocumentFooter,
  buildInitialDocumentSettingsFormValues,
  validateDocumentSettingsForm,
} from "./document-settings";

describe("document-settings", () => {
  it("buildDefaultDocumentFooter joins name, phone and address from the given profile", () => {
    const profile = getCabinetProfileMockData();
    expect(buildDefaultDocumentFooter(profile)).toBe(`${profile.name} — ${profile.phone} — ${profile.address}`);
  });

  it("buildDefaultDocumentFooter omits an unset address", () => {
    const profile = { ...getCabinetProfileMockData(), address: undefined };
    expect(buildDefaultDocumentFooter(profile)).toBe(`${profile.name} — ${profile.phone}`);
  });

  it("getDocumentSettingsMockData derives its footer/language from the Cabinet profile fixture, not an independent value", () => {
    const profile = getCabinetProfileMockData();
    const settings = getDocumentSettingsMockData();
    expect(settings.footerText).toBe(buildDefaultDocumentFooter(profile));
    expect(settings.documentLanguage).toBe(profile.preferredLanguage);
  });

  it("buildInitialDocumentSettingsFormValues defaults an absent headerNote to an empty string", () => {
    const values = buildInitialDocumentSettingsFormValues({ footerText: "x", documentLanguage: "fr" });
    expect(values).toEqual({ footerText: "x", headerNote: "", documentLanguage: "fr" });
  });

  it("validateDocumentSettingsForm requires a non-blank footer", () => {
    expect(
      validateDocumentSettingsForm({ footerText: "  ", headerNote: "", documentLanguage: "fr" }, { required: "required" }),
    ).toEqual({ footerText: "required" });
    expect(
      validateDocumentSettingsForm({ footerText: "Cabinet X", headerNote: "", documentLanguage: "fr" }, { required: "required" }),
    ).toEqual({});
  });

  it("applyDocumentSettingsUpdate trims text fields and drops a blank headerNote", () => {
    const updated = applyDocumentSettingsUpdate(getDocumentSettingsMockData(), {
      footerText: "  New footer  ",
      headerNote: "   ",
      documentLanguage: "ar",
    });
    expect(updated).toEqual({ footerText: "New footer", headerNote: undefined, documentLanguage: "ar" });
  });
});
