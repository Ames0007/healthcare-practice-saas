import { describe, expect, it } from "vitest";
import { buildItemRows } from "./items";
import { getInventoryItemsMockData } from "./mock-items-data";
import { getStockMovementsMockData } from "./mock-movements-data";

describe("buildItemRows", () => {
  const rows = buildItemRows(getInventoryItemsMockData(), getStockMovementsMockData());

  it("returns one row per item with a derived balance/status", () => {
    expect(rows).toHaveLength(getInventoryItemsMockData().length);
    const compresses = rows.find((row) => row.item.id === "item-02")!;
    expect(compresses.balance).toBe(18);
    expect(compresses.attentionStatus).toBe("low");
  });

  it("orders rows worst-attention-first", () => {
    const statuses = rows.map((row) => row.attentionStatus);
    const outOfStockIndex = statuses.indexOf("out_of_stock");
    const availableIndex = statuses.indexOf("available");
    expect(outOfStockIndex).toBeLessThan(availableIndex);
    expect(statuses[0]).toBe("out_of_stock");
  });

  it("sorts alphabetically within the same attention tier", () => {
    const outOfStockNames = rows.filter((row) => row.attentionStatus === "out_of_stock").map((row) => row.item.name);
    expect(outOfStockNames).toEqual([...outOfStockNames].sort((a, b) => a.localeCompare(b, "fr")));
  });
});
