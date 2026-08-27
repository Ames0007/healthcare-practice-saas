import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getInventoryItemsMockData } from "@/features/stock/mock-items-data";
import { getInventoryLotsMockData } from "@/features/stock/mock-lots-data";
import { getStockMovementsMockData } from "@/features/stock/mock-movements-data";
import { computeStockKpis } from "@/features/stock/dashboard";
import { buildItemRows } from "@/features/stock/items";
import { computeStockReportKpis } from "./stock-report";

describe("computeStockReportKpis (real fixtures)", () => {
  const items = getInventoryItemsMockData();
  const lots = getInventoryLotsMockData();
  const movements = getStockMovementsMockData();
  const kpis = computeStockReportKpis(items, lots, movements, MOCK_BUSINESS_DATE);

  it("includes item-07 (out_of_stock) in outOfStockCount", () => {
    const rows = buildItemRows(items, movements);
    expect(rows.find((row) => row.item.id === "item-07")?.attentionStatus).toBe("out_of_stock");
    expect(kpis.outOfStockCount).toBeGreaterThanOrEqual(1);
  });

  it("includes item-02 (low, the task's own worked example) in lowStockCount, not outOfStockCount", () => {
    expect(kpis.lowStockCount).toBeGreaterThanOrEqual(1);
  });

  it("outOfStockCount + lowStockCount reconciles exactly with computeStockKpis's own combined lowStockItemsCount — never a second, independent tally", () => {
    const stockKpis = computeStockKpis(items, lots, movements, MOCK_BUSINESS_DATE);
    expect(kpis.outOfStockCount + kpis.lowStockCount).toBe(stockKpis.lowStockItemsCount);
  });

  it("expiringLotsCount reconciles exactly with computeStockKpis's own count (4)", () => {
    const stockKpis = computeStockKpis(items, lots, movements, MOCK_BUSINESS_DATE);
    expect(kpis.expiringLotsCount).toBe(stockKpis.expiringLotsCount);
    expect(kpis.expiringLotsCount).toBe(4);
  });
});
