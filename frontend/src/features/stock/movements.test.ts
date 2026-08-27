import { describe, expect, it } from "vitest";
import type { StockMovement, StockMovementFormValues } from "@/components/domain/stock/types";
import {
  buildInitialMovementFormValues,
  buildMovementFromFormValues,
  buildMovementHistory,
  getMovementsForItem,
  isValidMovementQuantity,
  sortMovementsDesc,
  wouldCauseNegativeItemBalance,
  wouldCauseNegativeLotBalance,
} from "./movements";

const MOVEMENTS: StockMovement[] = [
  { id: "m1", itemId: "item-a", type: "in", direction: "in", quantity: 10, date: "2026-08-01", reason: "stock_received" },
  { id: "m2", itemId: "item-a", type: "out", direction: "out", quantity: 4, date: "2026-08-10", reason: "used_for_care" },
  { id: "m3", itemId: "item-a", type: "in", direction: "in", quantity: 5, date: "2026-08-15", reason: "stock_received" },
  { id: "m4", itemId: "item-b", type: "in", direction: "in", quantity: 3, date: "2026-08-05", reason: "stock_received" },
];

describe("getMovementsForItem", () => {
  it("returns only the given item's movements", () => {
    expect(getMovementsForItem(MOVEMENTS, "item-a")).toHaveLength(3);
    expect(getMovementsForItem(MOVEMENTS, "item-b")).toHaveLength(1);
    expect(getMovementsForItem(MOVEMENTS, "item-unknown")).toHaveLength(0);
  });
});

describe("sortMovementsDesc", () => {
  it("orders most recent first without mutating the input", () => {
    const itemA = getMovementsForItem(MOVEMENTS, "item-a");
    const sorted = sortMovementsDesc(itemA);
    expect(sorted).not.toBe(itemA);
    expect(sorted.map((m) => m.id)).toEqual(["m3", "m2", "m1"]);
  });
});

describe("buildMovementHistory", () => {
  it("computes a running balance after each movement, most recent first", () => {
    const rows = buildMovementHistory(getMovementsForItem(MOVEMENTS, "item-a"));
    expect(rows.map((row) => ({ id: row.movement.id, balanceAfter: row.balanceAfter }))).toEqual([
      { id: "m3", balanceAfter: 11 },
      { id: "m2", balanceAfter: 6 },
      { id: "m1", balanceAfter: 10 },
    ]);
  });

  it("the most recent row's balanceAfter equals the item's total computed balance", () => {
    const rows = buildMovementHistory(getMovementsForItem(MOVEMENTS, "item-a"));
    expect(rows[0].balanceAfter).toBe(11);
  });
});

describe("isValidMovementQuantity", () => {
  it("accepts a positive quantity", () => {
    expect(isValidMovementQuantity(5)).toBe(true);
  });

  it("rejects zero and negative quantities", () => {
    expect(isValidMovementQuantity(0)).toBe(false);
    expect(isValidMovementQuantity(-1)).toBe(false);
  });

  it("rejects NaN", () => {
    expect(isValidMovementQuantity(Number.NaN)).toBe(false);
  });
});

describe("wouldCauseNegativeItemBalance (negative-stock disallowed policy)", () => {
  it("an IN movement never causes a negative balance", () => {
    expect(wouldCauseNegativeItemBalance(MOVEMENTS, "item-a", "in", 999)).toBe(false);
  });

  it("an OUT within the current balance is allowed", () => {
    expect(wouldCauseNegativeItemBalance(MOVEMENTS, "item-a", "out", 11)).toBe(false);
  });

  it("an OUT exceeding the current balance is blocked", () => {
    expect(wouldCauseNegativeItemBalance(MOVEMENTS, "item-a", "out", 12)).toBe(true);
  });
});

describe("wouldCauseNegativeLotBalance (negative-stock disallowed policy, per lot)", () => {
  const lotMovements: StockMovement[] = [
    { id: "l1", itemId: "item-a", lotId: "lot-1", type: "in", direction: "in", quantity: 5, date: "2026-08-01", reason: "stock_received" },
  ];

  it("blocks an OUT exceeding the specific lot's own balance", () => {
    expect(wouldCauseNegativeLotBalance(lotMovements, "lot-1", "out", 6)).toBe(true);
  });

  it("allows an OUT within the lot's own balance", () => {
    expect(wouldCauseNegativeLotBalance(lotMovements, "lot-1", "out", 5)).toBe(false);
  });
});

describe("buildInitialMovementFormValues / buildMovementFromFormValues", () => {
  it("defaults direction to 'out' for an OUT movement and 'in' otherwise", () => {
    expect(buildInitialMovementFormValues("out", "used_for_care", "2026-08-23").direction).toBe("out");
    expect(buildInitialMovementFormValues("in", "stock_received", "2026-08-23").direction).toBe("in");
    expect(buildInitialMovementFormValues("adjustment", "inventory_correction", "2026-08-23").direction).toBe("in");
  });

  it("builds a full movement from form values, trimming a blank note to undefined", () => {
    const values: StockMovementFormValues = {
      type: "in",
      direction: "in",
      quantity: "10",
      date: "2026-08-23",
      reason: "stock_received",
      note: "  ",
      lotId: "",
      newLotNumber: "",
      newLotExpirationDate: "",
    };
    const movement = buildMovementFromFormValues("mv-x", "item-a", values, undefined);
    expect(movement).toEqual({ id: "mv-x", itemId: "item-a", lotId: undefined, type: "in", direction: "in", quantity: 10, date: "2026-08-23", reason: "stock_received", note: undefined });
  });

  it("preserves a real note and lotId", () => {
    const values: StockMovementFormValues = {
      type: "out",
      direction: "out",
      quantity: "3",
      date: "2026-08-23",
      reason: "used_for_care",
      note: "Consultation Dr. Benali",
      lotId: "lot-1",
      newLotNumber: "",
      newLotExpirationDate: "",
    };
    const movement = buildMovementFromFormValues("mv-y", "item-a", values, "lot-1");
    expect(movement.note).toBe("Consultation Dr. Benali");
    expect(movement.lotId).toBe("lot-1");
  });
});
