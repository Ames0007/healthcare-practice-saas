import { describe, expect, it } from "vitest";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { getStockMovementsMockData } from "./mock-movements-data";
import { computeItemStockBalance, resolveStockAttentionStatus } from "./stock";
import { buildItemRows } from "./items";
import { computeLotBalance, getExpiryAttentionLots, getLotsForItem, resolveLotExpiryStatus } from "./lots";
import { buildMovementHistory, getMovementsForItem } from "./movements";
import { computeStockKpis, getAttentionItems, getExpiryAttentionForDashboard } from "./dashboard";

/**
 * Proves the full required inventory chain end to end, using only the
 * centralized fixtures every gate's own screens already read from — no
 * module here duplicates another's own data (mirrors
 * `features/team/cross-hr-integrity.test.ts`'s own §64-style discipline).
 */
describe("Cross-inventory integrity — the full required chain", () => {
  const items = getInventoryItemsMockData();
  const lots = getInventoryLotsMockData();
  const movements = getStockMovementsMockData();
  const compresses = items.find((item) => item.id === "item-02")!;

  it("StockMovement -> InventoryItem balance: the item's own balance is the sum of its own movements, never a stored/independent figure", () => {
    const balance = computeItemStockBalance(movements, compresses.id);
    expect(balance).toBe(18);
  });

  it("StockMovement -> InventoryLot balance -> InventoryItem balance: for a lot-tracked item, the sum of every one of its own lots' balances equals the item's own total balance exactly", () => {
    for (const item of items.filter((candidate) => candidate.lotTracking)) {
      const itemBalance = computeItemStockBalance(movements, item.id);
      const lotBalanceSum = getLotsForItem(lots, item.id).reduce((total, lot) => total + computeLotBalance(movements, lot.id), 0);
      expect(lotBalanceSum).toBe(itemBalance);
    }
  });

  it("InventoryItem.stockPolicy + real balance -> StockAttentionStatus: reproduces the task's own worked example exactly (item-02: 18/25/low)", () => {
    const balance = computeItemStockBalance(movements, compresses.id);
    expect(resolveStockAttentionStatus(balance, compresses.stockPolicy)).toBe("low");
  });

  it("InventoryLot.expirationDate + MOCK_BUSINESS_DATE -> LotExpiryStatus -> dashboard expiry attention: the same lot resolves identically whether read through the item's own Lots tab or the dashboard", () => {
    const lot = lots.find((candidate) => candidate.id === "lot-02-1")!;
    const statusViaLot = resolveLotExpiryStatus(lot.expirationDate, MOCK_BUSINESS_DATE);
    const dashboardRow = getExpiryAttentionForDashboard(items, lots, movements, MOCK_BUSINESS_DATE).find((row) => row.lot.id === "lot-02-1");
    expect(dashboardRow).toBeDefined();
    expect(dashboardRow!.expiryStatus).toBe(statusViaLot);
  });

  it("StockMovement history -> running balance: the most recent row's balanceAfter equals the item's own computeItemStockBalance", () => {
    const itemMovements = getMovementsForItem(movements, compresses.id);
    const history = buildMovementHistory(itemMovements);
    expect(history[0].balanceAfter).toBe(computeItemStockBalance(movements, compresses.id));
  });

  it("Item catalog rows -> dashboard attention items: the exact same set (worst-first) appears whether read through Articles or the dashboard", () => {
    const catalogAttention = buildItemRows(items, movements).filter((row) => row.attentionStatus !== "available");
    const dashboardAttention = getAttentionItems(items, movements);
    expect(dashboardAttention.map((row) => row.item.id)).toEqual(catalogAttention.map((row) => row.item.id));
  });

  it("Dashboard KPI counts reconcile exactly with their own underlying derivations, never an independently hardcoded number", () => {
    const kpis = computeStockKpis(items, lots, movements, MOCK_BUSINESS_DATE);
    expect(kpis.lowStockItemsCount).toBe(
      buildItemRows(items, movements).filter((row) => row.attentionStatus === "out_of_stock" || row.attentionStatus === "critical" || row.attentionStatus === "low").length,
    );
    expect(kpis.expiringLotsCount).toBe(getExpiryAttentionLots(lots, movements, MOCK_BUSINESS_DATE).length);
  });

  it("no contradictory duplicate fixture universes: every module resolves the same item/lot identity consistently", () => {
    // The reconciliations above only succeed if InventoryItem, InventoryLot and
    // StockMovement all agree on `item-02`'s identity across every module —
    // proven by every assertion above already succeeding against the same ids.
    expect(compresses.id).toBe("item-02");
    expect(lots.every((lot) => items.some((item) => item.id === lot.itemId))).toBe(true);
    expect(movements.every((movement) => items.some((item) => item.id === movement.itemId))).toBe(true);
  });
});
