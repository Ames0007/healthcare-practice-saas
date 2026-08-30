import { describe, expect, it } from "vitest";
import type { PlatformAuditEvent } from "@/components/domain/platform-admin/types";
import { getAuditActionLabelKey, sortPlatformAuditEventsDescending } from "./audit";

const EVENTS: PlatformAuditEvent[] = [
  { id: "e-1", occurredAt: "2026-01-01", actionCode: "tenant.suspended", resourceType: "tenant", resourceId: "t-1" },
  { id: "e-2", occurredAt: "2026-08-01", actionCode: "user.disabled", resourceType: "user", resourceId: "u-1" },
  { id: "e-3", occurredAt: "2026-04-01", actionCode: "subscription.cancelled", resourceType: "subscription", resourceId: "s-1" },
];

describe("sortPlatformAuditEventsDescending", () => {
  it("orders newest first", () => {
    expect(sortPlatformAuditEventsDescending(EVENTS).map((e) => e.id)).toEqual(["e-2", "e-3", "e-1"]);
  });

  it("never mutates the input array", () => {
    const original = [...EVENTS];
    sortPlatformAuditEventsDescending(EVENTS);
    expect(EVENTS).toEqual(original);
  });
});

describe("getAuditActionLabelKey", () => {
  it("maps every implemented action code to a distinct translation key", () => {
    expect(getAuditActionLabelKey("tenant.suspended")).toBe("admin.activity.audit.action.tenant_suspended");
    expect(getAuditActionLabelKey("subscription.manual_renewal")).toBe("admin.activity.audit.action.subscription_manual_renewal");
    expect(getAuditActionLabelKey("user.unlocked")).toBe("admin.activity.audit.action.user_unlocked");
  });
});
