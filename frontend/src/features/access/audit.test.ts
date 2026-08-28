import { describe, expect, it } from "vitest";
import type { AccessAuditEvent } from "@/components/domain/access/types";
import { resolveAuditDetailLabel, sortAuditEventsDescending } from "./audit";

const t = (key: string) => key;

describe("audit", () => {
  it("resolveAuditDetailLabel resolves a permission_granted detail to its catalog label", () => {
    const event: AccessAuditEvent = {
      id: "a1",
      occurredAt: "2026-01-01",
      type: "permission_granted",
      actorMembershipId: "m1",
      targetMembershipId: "m2",
      detail: "invoices.view",
    };
    expect(resolveAuditDetailLabel(event, t)).toBe("access.permission.invoices_view");
  });

  it("resolveAuditDetailLabel falls back to the raw detail for a role/delegation id", () => {
    const event: AccessAuditEvent = {
      id: "a2",
      occurredAt: "2026-01-01",
      type: "role_assigned",
      actorMembershipId: "m1",
      targetMembershipId: "m2",
      detail: "role-receptionist",
    };
    expect(resolveAuditDetailLabel(event, t)).toBe("role-receptionist");
  });

  it("resolveAuditDetailLabel returns an em dash for a missing detail", () => {
    const event: AccessAuditEvent = {
      id: "a3",
      occurredAt: "2026-01-01",
      type: "user_deactivated",
      actorMembershipId: "m1",
      targetMembershipId: "m2",
    };
    expect(resolveAuditDetailLabel(event, t)).toBe("—");
  });

  it("sortAuditEventsDescending orders newest first without mutating the input", () => {
    const events: AccessAuditEvent[] = [
      { id: "a1", occurredAt: "2026-01-01", type: "role_assigned", actorMembershipId: "m1", targetMembershipId: "m2" },
      { id: "a2", occurredAt: "2026-06-15", type: "role_assigned", actorMembershipId: "m1", targetMembershipId: "m2" },
    ];
    const sorted = sortAuditEventsDescending(events);
    expect(sorted.map((event) => event.id)).toEqual(["a2", "a1"]);
    expect(events.map((event) => event.id)).toEqual(["a1", "a2"]);
  });
});
