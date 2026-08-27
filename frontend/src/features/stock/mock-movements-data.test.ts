import { describe, expect, it } from "vitest";
import { REASON_OPTIONS_BY_MOVEMENT_TYPE } from "@/components/domain/stock/movement-reason";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { getStockMovementsMockData } from "./mock-movements-data";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getInventoryLotsMockData } from "./mock-lots-data";
import { computeItemStockBalance } from "./stock";

/** Verifies the exact target balances documented in `mock-movements-data.ts`'s own header comment. */
const EXPECTED_ITEM_BALANCES: Record<string, number> = {
  "item-01": 20,
  "item-02": 18,
  "item-03": 8,
  "item-04": 3,
  "item-05": 20,
  "item-06": 10,
  "item-07": 0,
  "item-08": 6,
  "item-09": 12,
  "item-10": 15,
  "item-11": 5,
  "item-12": 2,
  "item-13": 40,
  "item-14": 7,
  "item-15": 30,
  "item-16": 3,
  "item-17": 8,
  "item-18": 25,
  "item-19": 8,
  "item-20": 20,
  "item-21": 0,
  "item-22": 4,
  "item-23": 10,
  "item-24": 4,
};

describe("mock-movements-data fixture integrity", () => {
  const movements = getStockMovementsMockData();
  const items = getInventoryItemsMockData();
  const lots = getInventoryLotsMockData();

  it("every item's computed balance matches its documented target", () => {
    for (const [itemId, expected] of Object.entries(EXPECTED_ITEM_BALANCES)) {
      expect(computeItemStockBalance(movements, itemId)).toBe(expected);
    }
  });

  it("covers every item fixture with at least one movement", () => {
    for (const item of items) {
      const hasMovement = movements.some((movement) => movement.itemId === item.id);
      expect(hasMovement).toBe(true);
    }
  });

  it("every movement's itemId references a real item", () => {
    const itemIds = new Set(items.map((item) => item.id));
    for (const movement of movements) {
      expect(itemIds.has(movement.itemId)).toBe(true);
    }
  });

  it("every movement's lotId (when present) references a real lot of the same item", () => {
    const lotsById = new Map(lots.map((lot) => [lot.id, lot]));
    for (const movement of movements) {
      if (!movement.lotId) continue;
      const lot = lotsById.get(movement.lotId);
      expect(lot).toBeDefined();
      expect(lot!.itemId).toBe(movement.itemId);
    }
  });

  it("every movement of a lotTracking item carries a lotId, and no movement of a non-lotTracking item does", () => {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    for (const movement of movements) {
      const item = itemsById.get(movement.itemId)!;
      if (item.lotTracking) {
        expect(movement.lotId).toBeDefined();
      } else {
        expect(movement.lotId).toBeUndefined();
      }
    }
  });

  it("uses every StockMovementReason value at least once", () => {
    const reasons = new Set(movements.map((movement) => movement.reason));
    expect(reasons).toEqual(
      new Set(["stock_received", "returned_to_stock", "initial_stock", "used_for_care", "expired_discarded", "damaged_or_lost", "internal_use", "inventory_correction", "other"]),
    );
  });

  it("includes at least one adjustment movement in each direction", () => {
    const adjustments = movements.filter((movement) => movement.type === "adjustment");
    expect(adjustments.some((movement) => movement.direction === "in")).toBe(true);
    expect(adjustments.some((movement) => movement.direction === "out")).toBe(true);
  });

  it("every movement's reason is within the bounded vocabulary for its own type", () => {
    for (const movement of movements) {
      expect(REASON_OPTIONS_BY_MOVEMENT_TYPE[movement.type]).toContain(movement.reason);
    }
  });

  it("in/out movements have direction matching their type (adjustment is the only type where direction is independently chosen)", () => {
    for (const movement of movements) {
      if (movement.type === "in") expect(movement.direction).toBe("in");
      if (movement.type === "out") expect(movement.direction).toBe("out");
    }
  });

  it("no movement is dated after MOCK_BUSINESS_DATE (a movement cannot be recorded in the future)", () => {
    for (const movement of movements) {
      expect(movement.date <= MOCK_BUSINESS_DATE).toBe(true);
    }
  });
});
