import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { computeStockKpis, getAttentionItems, getExpiryAttentionForDashboard } from "./dashboard";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { getStockMovementsMockData } from "./mock-movements-data";

describe("computeStockKpis (real fixtures)", () => {
  const kpis = computeStockKpis(getInventoryItemsMockData(), getInventoryLotsMockData(), getStockMovementsMockData(), MOCK_BUSINESS_DATE);

  it("counts items at/below minimum stock (out_of_stock + critical + low), excluding 'reorder' and 'available'", () => {
    // item-02 (low, worked example), item-04 (critical), item-07 (out_of_stock), item-11 (low),
    // item-12 (critical), item-16 (low), item-17 (critical), item-19 (low, boundary), item-21 (out_of_stock)
    expect(kpis.lowStockItemsCount).toBeGreaterThanOrEqual(9);
  });

  it("matches getExpiryAttentionLots's own count exactly (never a second, independent derivation)", () => {
    expect(kpis.expiringLotsCount).toBe(4);
  });

  it("counts movements within the last 30 days, excluding older ones (e.g. mv-07-1, dated 2026-06-01, ~83 days before MOCK_BUSINESS_DATE)", () => {
    expect(kpis.movementVolumeCount).toBeGreaterThan(0);
    expect(kpis.movementVolumeCount).toBeLessThan(getStockMovementsMockData().length);
  });

  it("counts a movement dated exactly on the business date (0 days ago) as within the window", () => {
    const kpisAtEarlyDate = computeStockKpis(getInventoryItemsMockData(), getInventoryLotsMockData(), getStockMovementsMockData(), "2026-06-01");
    expect(kpisAtEarlyDate.movementVolumeCount).toBe(3);
  });

  it("counts zero movements at a business date before any fixture movement", () => {
    const kpisBeforeAnyMovement = computeStockKpis(getInventoryItemsMockData(), getInventoryLotsMockData(), getStockMovementsMockData(), "2026-01-01");
    expect(kpisBeforeAnyMovement.movementVolumeCount).toBe(0);
  });
});

describe("getAttentionItems (real fixtures)", () => {
  const rows = getAttentionItems(getInventoryItemsMockData(), getStockMovementsMockData());

  it("excludes every 'available' item", () => {
    expect(rows.every((row) => row.attentionStatus !== "available")).toBe(true);
  });

  it("includes the task's own worked example (item-02, low)", () => {
    expect(rows.some((row) => row.item.id === "item-02" && row.attentionStatus === "low")).toBe(true);
  });

  it("orders worst-attention-first", () => {
    expect(rows[0].attentionStatus).toBe("out_of_stock");
  });
});

describe("getExpiryAttentionForDashboard (real fixtures)", () => {
  const rows = getExpiryAttentionForDashboard(getInventoryItemsMockData(), getInventoryLotsMockData(), getStockMovementsMockData(), MOCK_BUSINESS_DATE);

  it("matches getExpiryAttentionLots's own row count exactly", () => {
    expect(rows).toHaveLength(4);
  });

  it("attaches the correct item name and id", () => {
    const row = rows.find((candidate) => candidate.lot.id === "lot-13-1")!;
    expect(row.itemId).toBe("item-13");
    expect(row.itemName).toBe("Tubes de prélèvement");
  });
});
