import { describe, expect, it } from "vitest";
import type { Delegation } from "@/components/domain/access/types";
import { resolveDelegationStatus } from "./delegation-lifecycle";

function delegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "d1",
    delegatorMembershipId: "membership-1",
    delegateMembershipId: "membership-2",
    permissionKey: "invoices.create",
    startsAt: "2026-08-01",
    endsAt: "2026-08-31",
    createdAt: "2026-07-31",
    ...overrides,
  };
}

describe("delegation-lifecycle", () => {
  it("resolves 'scheduled' before startsAt", () => {
    expect(resolveDelegationStatus(delegation({ startsAt: "2026-09-01" }), "2026-08-23")).toBe("scheduled");
  });

  it("resolves 'active' between startsAt and endsAt inclusive", () => {
    expect(resolveDelegationStatus(delegation(), "2026-08-23")).toBe("active");
    expect(resolveDelegationStatus(delegation(), "2026-08-01")).toBe("active");
    expect(resolveDelegationStatus(delegation(), "2026-08-31")).toBe("active");
  });

  it("resolves 'expired' after endsAt", () => {
    expect(resolveDelegationStatus(delegation({ endsAt: "2026-08-10" }), "2026-08-23")).toBe("expired");
  });

  it("resolves 'revoked' whenever revokedAt is set, even mid-window", () => {
    expect(resolveDelegationStatus(delegation({ revokedAt: "2026-08-15" }), "2026-08-23")).toBe("revoked");
  });

  it("revocation wins even if the delegation would otherwise still be scheduled", () => {
    expect(resolveDelegationStatus(delegation({ startsAt: "2026-09-01", revokedAt: "2026-08-15" }), "2026-08-23")).toBe("revoked");
  });
});
