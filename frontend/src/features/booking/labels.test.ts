import { describe, expect, it } from "vitest";
import { getUnavailableReasonLabelKey } from "./labels";

describe("getUnavailableReasonLabelKey", () => {
  it("never distinguishes practitioner_on_leave from any other generic unavailability (task §38 privacy)", () => {
    expect(getUnavailableReasonLabelKey("practitioner_on_leave")).toBe(getUnavailableReasonLabelKey("practitioner_not_scheduled"));
    expect(getUnavailableReasonLabelKey("practitioner_on_leave")).toBe(getUnavailableReasonLabelKey(undefined));
  });

  it("distinguishes closed from fully booked (task §37)", () => {
    expect(getUnavailableReasonLabelKey("cabinet_closed")).not.toBe(getUnavailableReasonLabelKey("fully_booked"));
  });

  it("maps holiday to the same closed label as an ordinary closure (never a distinct raw reason string)", () => {
    expect(getUnavailableReasonLabelKey("holiday")).toBe(getUnavailableReasonLabelKey("cabinet_closed"));
  });

  it("gives past_date its own distinct label", () => {
    expect(getUnavailableReasonLabelKey("past_date")).not.toBe(getUnavailableReasonLabelKey("cabinet_closed"));
    expect(getUnavailableReasonLabelKey("past_date")).not.toBe(getUnavailableReasonLabelKey("fully_booked"));
  });
});
