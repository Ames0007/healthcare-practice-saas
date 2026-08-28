import { describe, expect, it } from "vitest";
import { buildReferralCode, buildReferralLink } from "./referral-code";

describe("referral-code", () => {
  it("buildReferralCode derives an uppercase, letters-only prefix from the cabinet name", () => {
    expect(buildReferralCode("Cabinet (exemple)")).toBe("CABIN7X2");
  });

  it("buildReferralCode falls back to a neutral prefix when the name has no letters", () => {
    expect(buildReferralCode("123")).toBe("CAB7X2");
  });

  it("buildReferralCode is deterministic — same input always yields the same code", () => {
    expect(buildReferralCode("Cabinet (exemple)")).toBe(buildReferralCode("Cabinet (exemple)"));
  });

  it("buildReferralLink matches Spec #9 Screen 50's own format exactly", () => {
    expect(buildReferralLink("CABIN7X2")).toBe("app.ma/r/CABIN7X2");
  });
});
