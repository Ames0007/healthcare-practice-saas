import { describe, expect, it } from "vitest";
import { getPlanEntitlementsMockData } from "./mock-plans-data";
import { getEntitlementLimit, getUsageState, hasEntitlement } from "./entitlements";

describe("entitlements", () => {
  const entitlements = getPlanEntitlementsMockData();

  it("hasEntitlement is true for every boolean entitlement on both plans (no module is actually plan-gated in this prototype)", () => {
    expect(hasEntitlement(entitlements, "plan-solo", "inventory_enabled")).toBe(true);
    expect(hasEntitlement(entitlements, "plan-cabinet", "inventory_enabled")).toBe(true);
    expect(hasEntitlement(entitlements, "plan-solo", "hr_enabled")).toBe(true);
    expect(hasEntitlement(entitlements, "plan-cabinet", "commission_enabled")).toBe(true);
  });

  it("hasEntitlement is false for an entitlement code not configured on a plan", () => {
    expect(hasEntitlement([], "plan-solo", "inventory_enabled")).toBe(false);
  });

  it("getEntitlementLimit reproduces Screen 47's own worked example for the Cabinet plan", () => {
    expect(getEntitlementLimit(entitlements, "plan-cabinet", "max_practitioners")).toBe(3);
    expect(getEntitlementLimit(entitlements, "plan-cabinet", "max_staff")).toBe(5);
  });

  it("getEntitlementLimit is the plan's own defining practitioner cap for Solo", () => {
    expect(getEntitlementLimit(entitlements, "plan-solo", "max_practitioners")).toBe(1);
  });

  it("getEntitlementLimit is undefined where no spec/wireframe gives a figure (storage on both plans, staff on Solo)", () => {
    expect(getEntitlementLimit(entitlements, "plan-solo", "max_staff")).toBeUndefined();
    expect(getEntitlementLimit(entitlements, "plan-solo", "storage_bytes")).toBeUndefined();
    expect(getEntitlementLimit(entitlements, "plan-cabinet", "storage_bytes")).toBeUndefined();
  });

  it("getUsageState reports neither atLimit nor overLimit when usage is comfortably under the limit", () => {
    const usage = getUsageState(3, 2);
    expect(usage).toEqual({ used: 2, limit: 3, atLimit: false, overLimit: false });
  });

  it("getUsageState reports atLimit (not overLimit) exactly at the boundary", () => {
    const usage = getUsageState(3, 3);
    expect(usage.atLimit).toBe(true);
    expect(usage.overLimit).toBe(false);
  });

  it("getUsageState reports overLimit once usage exceeds the limit (WF-74's own scenario)", () => {
    const usage = getUsageState(1, 2);
    expect(usage.overLimit).toBe(true);
  });

  it("getUsageState never flags atLimit/overLimit when the limit itself is undefined", () => {
    const usage = getUsageState(undefined, 999);
    expect(usage.atLimit).toBe(false);
    expect(usage.overLimit).toBe(false);
  });
});
