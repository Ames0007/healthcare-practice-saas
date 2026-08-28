import { describe, expect, it } from "vitest";
import { getAppointmentSettingsMockData } from "./mock-appointment-settings-data";
import {
  applyAppointmentSettingsUpdate,
  buildInitialAppointmentSettingsFormValues,
  validateAppointmentSettingsForm,
} from "./appointment-settings";

describe("appointment-settings", () => {
  it("buildInitialAppointmentSettingsFormValues stringifies the numeric field", () => {
    const values = buildInitialAppointmentSettingsFormValues(getAppointmentSettingsMockData());
    expect(values).toEqual({ defaultSchedulingMode: "exact", defaultDurationMinutes: "30" });
  });

  it("validateAppointmentSettingsForm rejects a blank, zero, or negative duration", () => {
    const messages = { invalidNumber: "invalid" };
    expect(validateAppointmentSettingsForm({ defaultSchedulingMode: "exact", defaultDurationMinutes: "" }, messages)).toEqual({
      defaultDurationMinutes: "invalid",
    });
    expect(validateAppointmentSettingsForm({ defaultSchedulingMode: "exact", defaultDurationMinutes: "0" }, messages)).toEqual({
      defaultDurationMinutes: "invalid",
    });
    expect(validateAppointmentSettingsForm({ defaultSchedulingMode: "exact", defaultDurationMinutes: "-5" }, messages)).toEqual({
      defaultDurationMinutes: "invalid",
    });
  });

  it("validateAppointmentSettingsForm accepts a positive duration", () => {
    expect(validateAppointmentSettingsForm({ defaultSchedulingMode: "window", defaultDurationMinutes: "45" }, { invalidNumber: "invalid" })).toEqual(
      {},
    );
  });

  it("applyAppointmentSettingsUpdate rebuilds the settings from validated form values", () => {
    const updated = applyAppointmentSettingsUpdate(getAppointmentSettingsMockData(), {
      defaultSchedulingMode: "window",
      defaultDurationMinutes: "45",
    });
    expect(updated).toEqual({ defaultSchedulingMode: "window", defaultDurationMinutes: 45 });
  });
});
