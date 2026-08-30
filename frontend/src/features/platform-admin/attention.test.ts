import { describe, expect, it } from "vitest";
import type { Subscription } from "@/components/domain/subscription/types";
import type { Tenant } from "@/components/domain/platform-admin/types";
import { computeAttentionItems } from "./attention";

const TENANTS: Tenant[] = [
  { id: "t-1", name: "A", slug: "a", specialty: "general_medicine", status: "active", createdAt: "2026-01-01" },
  { id: "t-2", name: "B", slug: "b", specialty: "dentistry", status: "suspended", createdAt: "2026-01-01" },
];

const SUBSCRIPTIONS: Subscription[] = [
  { id: "s-1", tenantId: "t-1", planId: "plan-cabinet", billingPeriod: "monthly", status: "grace", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "s-2", tenantId: "t-2", planId: "plan-cabinet", billingPeriod: "monthly", status: "blackout", createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

describe("computeAttentionItems", () => {
  it("includes one row per non-zero condition", () => {
    const items = computeAttentionItems(TENANTS, SUBSCRIPTIONS);
    expect(items.map((item) => item.id)).toEqual(["attn-grace", "attn-blackout", "attn-suspended"]);
  });

  it("omits a row entirely when its count is zero — never a zero-value row", () => {
    const items = computeAttentionItems([], []);
    expect(items).toEqual([]);
  });

  it("counts are pure re-derivations that never diverge from the tenant/subscription arrays passed in", () => {
    const items = computeAttentionItems(TENANTS, SUBSCRIPTIONS);
    expect(items.find((item) => item.id === "attn-grace")?.count).toBe(1);
    expect(items.find((item) => item.id === "attn-blackout")?.count).toBe(1);
    expect(items.find((item) => item.id === "attn-suspended")?.count).toBe(1);
  });
});
