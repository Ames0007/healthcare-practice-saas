import { describe, expect, it } from "vitest";
import { validateCabinetSettingsForm } from "@/features/parametres/cabinet-settings";
import { buildServiceFromFormValues, validateServiceForm } from "@/features/parametres/services";
import { buildWorkingHoursFromFormValues, isValidWorkingHoursForm } from "@/features/parametres/working-hours";
import { validateAppointmentSettingsForm } from "@/features/parametres/appointment-settings";
import { CABINET_SPECIALTY_MAP, CABINET_SPECIALTY_ORDER } from "@/components/domain/settings/specialty";
import { WEEKDAY_ORDER } from "@/features/team/schedule";
import {
  buildInitialOnboardingCabinetValues,
  buildInitialOnboardingHoursValues,
  buildInitialOnboardingPreferencesValues,
} from "./onboarding-state";

const MESSAGES = { required: "requis", invalidPhone: "tel invalide", invalidEmail: "email invalide" };

/**
 * Reconciles Onboarding against the REAL Paramètres validators/helpers it
 * reuses outright (task §30-34) — proves no second Cabinet/Service/
 * WorkingHours/Preferences vocabulary was ever created for this task, only
 * imports of the exact same functions `CabinetSettingsPage`/
 * `ServicesPage`/`WorkingHoursPage`/`AppointmentSettingsPage` themselves
 * call.
 */
describe("onboarding cross-configuration integrity", () => {
  it("onboarding's blank Cabinet draft fails the exact same Paramètres validator the same way an empty Paramètres form would", () => {
    const errors = validateCabinetSettingsForm(buildInitialOnboardingCabinetValues(), MESSAGES);
    expect(errors.name).toBe(MESSAGES.required);
    expect(errors.phone).toBe(MESSAGES.required);
  });

  it("onboarding's specialty options are the exact same CABINET_SPECIALTY_ORDER/MAP Paramètres itself renders — never a second list", () => {
    expect(CABINET_SPECIALTY_ORDER).toContain(buildInitialOnboardingCabinetValues().specialty);
    for (const specialty of CABINET_SPECIALTY_ORDER) {
      expect(CABINET_SPECIALTY_MAP[specialty].translationKey).toMatch(/^parametres\.cabinet\.specialty\./);
    }
  });

  it("onboarding's blank Hours draft (every day closed) passes the exact same isValidWorkingHoursForm Paramètres itself uses", () => {
    expect(isValidWorkingHoursForm(buildInitialOnboardingHoursValues())).toBe(true);
  });

  it("buildWorkingHoursFromFormValues turns the onboarding draft into the exact CabinetWorkingHoursDay[] shape Paramètres persists — same weekday order, no split-interval support invented", () => {
    const days = buildWorkingHoursFromFormValues(buildInitialOnboardingHoursValues());
    expect(days.map((day) => day.weekday)).toEqual(WEEKDAY_ORDER);
    expect(days.every((day) => day.isOpen === false && day.startTime === undefined)).toBe(true);
  });

  it("a service built during onboarding uses the exact same id scheme Paramètres uses, so it would never collide if later merged into the real Services list", () => {
    const formValues = { name: "Consultation", durationMinutes: "30", price: "300", schedulingMode: "exact" as const, active: true };
    expect(validateServiceForm(formValues, { required: "requis", invalidNumber: "nombre invalide" })).toEqual({});

    const firstService = buildServiceFromFormValues(formValues, undefined, []);
    expect(firstService.id).toBe("svc-1");

    const secondService = buildServiceFromFormValues(formValues, undefined, [firstService]);
    expect(secondService.id).toBe("svc-2");
  });

  it("onboarding's default preferences pass the exact same validateAppointmentSettingsForm Paramètres uses", () => {
    expect(validateAppointmentSettingsForm(buildInitialOnboardingPreferencesValues(), { invalidNumber: "nombre invalide" })).toEqual({});
  });
});
