import { describe, expect, it } from "vitest";
import type { InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import {
  buildCabinetLotRows,
  buildLotRows,
  computeDaysUntil,
  computeLotBalance,
  getExpiryAttentionLots,
  getLotsForItem,
  matchesLotExpiryFilter,
  matchesLotSearch,
  resolveLotExpiryStatus,
  sortLotsByExpiration,
} from "./lots";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { getStockMovementsMockData } from "./mock-movements-data";

/** Arbitrary example date for pure-arithmetic tests below — independent of the app's real `MOCK_BUSINESS_DATE` (used separately for the real-fixture tests further down). */
const BUSINESS_DATE = "2026-08-27";

describe("computeLotBalance", () => {
  const movements: StockMovement[] = [
    { id: "m1", itemId: "item-a", lotId: "lot-1", type: "in", direction: "in", quantity: 10, date: "2026-08-01", reason: "stock_received" },
    { id: "m2", itemId: "item-a", lotId: "lot-1", type: "out", direction: "out", quantity: 3, date: "2026-08-10", reason: "used_for_care" },
    { id: "m3", itemId: "item-a", lotId: "lot-2", type: "in", direction: "in", quantity: 5, date: "2026-08-01", reason: "stock_received" },
  ];

  it("sums direction-signed quantities for one lot only", () => {
    expect(computeLotBalance(movements, "lot-1")).toBe(7);
    expect(computeLotBalance(movements, "lot-2")).toBe(5);
  });
});

describe("computeDaysUntil", () => {
  it("returns 0 for the same date", () => {
    expect(computeDaysUntil(BUSINESS_DATE, BUSINESS_DATE)).toBe(0);
  });

  it("returns a positive number for a future date", () => {
    expect(computeDaysUntil("2026-09-06", BUSINESS_DATE)).toBe(10);
  });

  it("returns a negative number for a past date", () => {
    expect(computeDaysUntil("2026-08-20", BUSINESS_DATE)).toBe(-7);
  });
});

describe("resolveLotExpiryStatus", () => {
  it("returns null when there is no expiration date", () => {
    expect(resolveLotExpiryStatus(undefined, BUSINESS_DATE)).toBeNull();
  });

  it("resolves expired for a past date", () => {
    expect(resolveLotExpiryStatus("2026-08-01", BUSINESS_DATE)).toBe("expired");
  });

  it("resolves expiring_soon within the 30-day horizon", () => {
    expect(resolveLotExpiryStatus("2026-09-16", BUSINESS_DATE)).toBe("expiring_soon");
  });

  it("resolves valid beyond the 30-day horizon", () => {
    expect(resolveLotExpiryStatus("2027-01-01", BUSINESS_DATE)).toBe("valid");
  });

  it("treats exactly 30 days out as still expiring_soon (inclusive boundary)", () => {
    expect(resolveLotExpiryStatus("2026-09-26", BUSINESS_DATE)).toBe("expiring_soon");
  });

  it("treats 31 days out as valid", () => {
    expect(resolveLotExpiryStatus("2026-09-27", BUSINESS_DATE)).toBe("valid");
  });
});

describe("getLotsForItem / sortLotsByExpiration (real fixtures)", () => {
  const lots = getInventoryLotsMockData();

  it("returns both lots for item-12 in expiration order", () => {
    const itemLots = sortLotsByExpiration(getLotsForItem(lots, "item-12"));
    expect(itemLots.map((lot) => lot.id)).toEqual(["lot-12-1", "lot-12-2"]);
  });

  it("returns an empty array for an item with no lots", () => {
    expect(getLotsForItem(lots, "item-01")).toEqual([]);
  });
});

describe("getExpiryAttentionLots (real fixtures)", () => {
  const lots = getInventoryLotsMockData();
  const movements = getStockMovementsMockData();
  const rows = getExpiryAttentionLots(lots, movements, MOCK_BUSINESS_DATE);

  it("includes an expired lot that still holds remaining quantity (item-13's lot-13-1)", () => {
    const row = rows.find((candidate) => candidate.lot.id === "lot-13-1");
    expect(row).toBeDefined();
    expect(row!.balance).toBe(5);
    expect(row!.expiryStatus).toBe("expired");
  });

  it("excludes a fully depleted expired lot (item-07's lot-07-1, balance 0)", () => {
    expect(rows.some((row) => row.lot.id === "lot-07-1")).toBe(false);
  });

  it("includes expiring-soon lots with remaining quantity (item-02's lot-02-1, item-06's lot-06-1)", () => {
    expect(rows.some((row) => row.lot.id === "lot-02-1")).toBe(true);
    expect(rows.some((row) => row.lot.id === "lot-06-1")).toBe(true);
  });

  it("excludes valid (far-future) lots", () => {
    expect(rows.some((row) => row.lot.id === "lot-04-1")).toBe(false);
  });

  it("orders rows by expiration date ascending", () => {
    const dates = rows.map((row) => row.lot.expirationDate);
    expect(dates).toEqual([...dates].sort((a, b) => a!.localeCompare(b!)));
  });
});

describe("buildLotRows (real fixtures)", () => {
  const lots = getInventoryLotsMockData();
  const movements = getStockMovementsMockData();
  const rows = buildLotRows(lots, movements, MOCK_BUSINESS_DATE);

  it("returns one row per lot", () => {
    expect(rows).toHaveLength(lots.length);
  });

  it("orders worst-expiry-first: expired lots before expiring-soon before valid", () => {
    const firstExpired = rows.findIndex((row) => row.expiryStatus === "expired");
    const firstValid = rows.findIndex((row) => row.expiryStatus === "valid");
    expect(firstExpired).toBeGreaterThanOrEqual(0);
    expect(firstExpired).toBeLessThan(firstValid);
    expect(rows[0].expiryStatus).toBe("expired");
  });

  it("includes the depleted expired lot too (unlike getExpiryAttentionLots, this is the full browsing list)", () => {
    const row = rows.find((candidate) => candidate.lot.id === "lot-07-1");
    expect(row).toBeDefined();
    expect(row!.balance).toBe(0);
    expect(row!.expiryStatus).toBe("expired");
  });
});

describe("buildCabinetLotRows / matchesLotSearch / matchesLotExpiryFilter (real fixtures)", () => {
  const rows = buildCabinetLotRows(getInventoryItemsMockData(), getInventoryLotsMockData(), getStockMovementsMockData(), MOCK_BUSINESS_DATE);

  it("attaches the correct item name to each lot row", () => {
    const row = rows.find((candidate) => candidate.lot.id === "lot-02-1")!;
    expect(row.itemName).toBe("Compresses stériles 10×10");
  });

  it("search matches by lot number or item name, case-insensitively", () => {
    const row = rows.find((candidate) => candidate.lot.id === "lot-02-1")!;
    expect(matchesLotSearch(row, "LOT-2026-0102")).toBe(true);
    expect(matchesLotSearch(row, "compresses")).toBe(true);
    expect(matchesLotSearch(row, "gants nitrile")).toBe(false);
    expect(matchesLotSearch(row, "")).toBe(true);
  });

  it("expiry filter: 'all' matches everything, a specific status matches only itself", () => {
    const row = rows.find((candidate) => candidate.lot.id === "lot-02-1")!;
    expect(matchesLotExpiryFilter(row, "all")).toBe(true);
    expect(matchesLotExpiryFilter(row, row.expiryStatus!)).toBe(true);
    const otherStatus = row.expiryStatus === "expired" ? "valid" : "expired";
    expect(matchesLotExpiryFilter(row, otherStatus)).toBe(false);
  });
});

describe("mock-lots-data fixture integrity", () => {
  const items = ["item-02", "item-04", "item-05", "item-06", "item-07", "item-08", "item-09", "item-12", "item-13", "item-14", "item-18", "item-22"];

  it("every lot-tracked item fixture has at least one lot", () => {
    const lots = getInventoryLotsMockData();
    for (const itemId of items) {
      expect(getLotsForItem(lots, itemId).length).toBeGreaterThan(0);
    }
  });

  it("every lot id and lotNumber is unique", () => {
    const lots: InventoryLot[] = getInventoryLotsMockData();
    expect(new Set(lots.map((lot) => lot.id)).size).toBe(lots.length);
    expect(new Set(lots.map((lot) => lot.lotNumber)).size).toBe(lots.length);
  });
});
