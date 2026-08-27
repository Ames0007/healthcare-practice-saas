import { describe, expect, it } from "vitest";
import type { InventoryItem, InventoryItemFormValues, StockMovement, StockPolicy } from "@/components/domain/stock/types";
import {
  buildInitialItemFormValues,
  buildItemFromFormValues,
  computeItemStockBalance,
  generateNextItemNumber,
  isValidItemTrackingFlags,
  isValidStockPolicy,
  matchesItemAttentionFilter,
  matchesItemCategoryFilter,
  matchesItemSearch,
  resolveStockAttentionStatus,
  sortItemsByName,
} from "./stock";
import { getInventoryItemsMockData } from "./mock-items-data";

describe("computeItemStockBalance", () => {
  const movements: StockMovement[] = [
    { id: "m1", itemId: "item-a", type: "in", direction: "in", quantity: 10, date: "2026-08-01", reason: "stock_received" },
    { id: "m2", itemId: "item-a", type: "out", direction: "out", quantity: 4, date: "2026-08-10", reason: "used_for_care" },
    { id: "m3", itemId: "item-b", type: "in", direction: "in", quantity: 5, date: "2026-08-01", reason: "stock_received" },
  ];

  it("sums direction-signed quantities for one item only", () => {
    expect(computeItemStockBalance(movements, "item-a")).toBe(6);
    expect(computeItemStockBalance(movements, "item-b")).toBe(5);
  });

  it("returns 0 for an item with no movements", () => {
    expect(computeItemStockBalance(movements, "item-unknown")).toBe(0);
  });
});

describe("resolveStockAttentionStatus", () => {
  it("reproduces the task's own worked example exactly (item-02: balance 18, min 25, safety 15, reorder 30 -> low)", () => {
    const policy: StockPolicy = { minimumStock: 25, safetyStock: 15, reorderPoint: 30 };
    expect(resolveStockAttentionStatus(18, policy)).toBe("low");
  });

  it("resolves out_of_stock at and below zero", () => {
    const policy: StockPolicy = { minimumStock: 10 };
    expect(resolveStockAttentionStatus(0, policy)).toBe("out_of_stock");
    expect(resolveStockAttentionStatus(-2, policy)).toBe("out_of_stock");
  });

  it("resolves critical only when safetyStock is configured and breached", () => {
    const policy: StockPolicy = { minimumStock: 10, safetyStock: 5 };
    expect(resolveStockAttentionStatus(5, policy)).toBe("critical");
    expect(resolveStockAttentionStatus(6, policy)).toBe("low");
  });

  it("falls back straight to low (skipping critical) when no safetyStock is configured", () => {
    const policy: StockPolicy = { minimumStock: 10 };
    expect(resolveStockAttentionStatus(1, policy)).toBe("low");
  });

  it("resolves reorder only when reorderPoint is configured and above minimum", () => {
    const policy: StockPolicy = { minimumStock: 10, reorderPoint: 15 };
    expect(resolveStockAttentionStatus(12, policy)).toBe("reorder");
    expect(resolveStockAttentionStatus(10, policy)).toBe("low");
  });

  it("falls back straight to available (skipping reorder) when no reorderPoint is configured", () => {
    const policy: StockPolicy = { minimumStock: 10 };
    expect(resolveStockAttentionStatus(11, policy)).toBe("available");
  });

  it("resolves available above every configured threshold", () => {
    const policy: StockPolicy = { minimumStock: 10, safetyStock: 5, reorderPoint: 15 };
    expect(resolveStockAttentionStatus(16, policy)).toBe("available");
  });
});

describe("isValidStockPolicy", () => {
  it("rejects any negative threshold", () => {
    expect(isValidStockPolicy({ minimumStock: -1 })).toBe(false);
    expect(isValidStockPolicy({ minimumStock: 5, safetyStock: -1 })).toBe(false);
  });

  it("rejects a maximum below the minimum", () => {
    expect(isValidStockPolicy({ minimumStock: 20, maximumStock: 10 })).toBe(false);
  });

  it("accepts a maximum at or above the minimum", () => {
    expect(isValidStockPolicy({ minimumStock: 20, maximumStock: 20 })).toBe(true);
    expect(isValidStockPolicy({ minimumStock: 20, maximumStock: 80 })).toBe(true);
  });

  it("accepts a policy with only the mandatory minimumStock set", () => {
    expect(isValidStockPolicy({ minimumStock: 0 })).toBe(true);
  });
});

describe("isValidItemTrackingFlags", () => {
  it("rejects expirationTracking without lotTracking", () => {
    expect(isValidItemTrackingFlags(false, true)).toBe(false);
  });

  it("accepts every other combination", () => {
    expect(isValidItemTrackingFlags(true, true)).toBe(true);
    expect(isValidItemTrackingFlags(true, false)).toBe(true);
    expect(isValidItemTrackingFlags(false, false)).toBe(true);
  });
});

describe("matchesItemSearch", () => {
  const items = getInventoryItemsMockData();
  const compresses = items.find((item) => item.id === "item-02")!;

  it("matches by name, case-insensitively", () => {
    expect(matchesItemSearch(compresses, "compresses")).toBe(true);
    expect(matchesItemSearch(compresses, "COMPRESSES")).toBe(true);
  });

  it("matches by item number", () => {
    expect(matchesItemSearch(compresses, "STK-0002")).toBe(true);
  });

  it("rejects a non-matching query", () => {
    expect(matchesItemSearch(compresses, "gants")).toBe(false);
  });

  it("treats an empty/whitespace query as matching everything", () => {
    expect(matchesItemSearch(compresses, "")).toBe(true);
    expect(matchesItemSearch(compresses, "   ")).toBe(true);
  });
});

describe("matchesItemCategoryFilter / matchesItemAttentionFilter", () => {
  const compresses = getInventoryItemsMockData().find((item) => item.id === "item-02")!;

  it("category filter: 'all' matches everything, a specific category matches only itself", () => {
    expect(matchesItemCategoryFilter(compresses, "all")).toBe(true);
    expect(matchesItemCategoryFilter(compresses, "medical_consumables")).toBe(true);
    expect(matchesItemCategoryFilter(compresses, "medicines")).toBe(false);
  });

  it("attention filter: 'all' matches everything, a specific status matches only itself", () => {
    expect(matchesItemAttentionFilter("low", "all")).toBe(true);
    expect(matchesItemAttentionFilter("low", "low")).toBe(true);
    expect(matchesItemAttentionFilter("low", "critical")).toBe(false);
  });
});

describe("sortItemsByName", () => {
  it("sorts alphabetically without mutating the input array", () => {
    const items = getInventoryItemsMockData();
    const sorted = sortItemsByName(items);
    expect(sorted).not.toBe(items);
    const names = sorted.map((item) => item.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "fr")));
  });
});

describe("generateNextItemNumber", () => {
  it("increments past the highest existing STK-#### sequence", () => {
    const items = getInventoryItemsMockData();
    expect(generateNextItemNumber(items)).toBe("STK-0025");
  });

  it("starts at STK-0001 for an empty catalog", () => {
    expect(generateNextItemNumber([])).toBe("STK-0001");
  });
});

describe("buildInitialItemFormValues / buildItemFromFormValues round-trip", () => {
  const items = getInventoryItemsMockData();
  const compresses = items.find((item) => item.id === "item-02")!;
  const lidocaine = items.find((item) => item.id === "item-06")!;

  it("round-trips every field of a fully configured item", () => {
    const values = buildInitialItemFormValues(compresses);
    const rebuilt = buildItemFromFormValues(values, compresses);
    expect(rebuilt).toEqual(compresses);
  });

  it("round-trips medicineMetadata for a medicines-category item", () => {
    const values = buildInitialItemFormValues(lidocaine);
    expect(values.medicineForm).toBe("Solution injectable");
    const rebuilt = buildItemFromFormValues(values, lidocaine);
    expect(rebuilt.medicineMetadata).toEqual(lidocaine.medicineMetadata);
  });

  it("builds a brand-new item with a generated item number and no id collision", () => {
    const values: InventoryItemFormValues = {
      ...buildInitialItemFormValues(),
      name: "Nouvel article",
      minimumStock: "5",
    };
    const created: InventoryItem = buildItemFromFormValues(values, undefined, "STK-0025");
    expect(created.itemNumber).toBe("STK-0025");
    expect(created.name).toBe("Nouvel article");
    expect(created.stockPolicy).toEqual({ minimumStock: 5, safetyStock: undefined, reorderPoint: undefined, maximumStock: undefined, reorderQuantity: undefined, leadTimeDays: undefined });
  });

  it("drops medicineMetadata when the category is not medicines even if form fields are set", () => {
    const values: InventoryItemFormValues = { ...buildInitialItemFormValues(), name: "X", minimumStock: "1", medicineForm: "Solution" };
    const created = buildItemFromFormValues(values);
    expect(created.medicineMetadata).toBeUndefined();
  });

  it("blank optional threshold strings become undefined, not NaN or 0", () => {
    const values = { ...buildInitialItemFormValues(), name: "X", minimumStock: "5" };
    const created = buildItemFromFormValues(values);
    expect(created.stockPolicy.safetyStock).toBeUndefined();
    expect(created.stockPolicy.reorderPoint).toBeUndefined();
  });
});
