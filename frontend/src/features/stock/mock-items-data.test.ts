import { describe, expect, it } from "vitest";
import { getInventoryItemsMockData } from "./mock-items-data";
import { isValidItemTrackingFlags, isValidStockPolicy } from "./stock";

describe("mock-items-data fixture integrity", () => {
  const items = getInventoryItemsMockData();

  it("has a unique id and itemNumber per item", () => {
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(new Set(items.map((item) => item.itemNumber)).size).toBe(items.length);
  });

  it("every itemNumber matches the STK-#### scheme", () => {
    for (const item of items) {
      expect(item.itemNumber).toMatch(/^STK-\d{4}$/);
    }
  });

  it("every item has a valid stock policy", () => {
    for (const item of items) {
      expect(isValidStockPolicy(item.stockPolicy)).toBe(true);
    }
  });

  it("every item has valid lot/expiration tracking flags", () => {
    for (const item of items) {
      expect(isValidItemTrackingFlags(item.lotTracking, item.expirationTracking)).toBe(true);
    }
  });

  it("medicineMetadata is present only for the medicines category", () => {
    for (const item of items) {
      if (item.medicineMetadata) {
        expect(item.category).toBe("medicines");
      }
    }
  });

  it("includes at least one item in every category", () => {
    const categories = new Set(items.map((item) => item.category));
    expect(categories).toEqual(
      new Set([
        "medical_consumables",
        "medicines",
        "procedure_products",
        "diagnostic_consumables",
        "sterilization_infection_control",
        "ppe",
        "disposable_medical_devices",
        "patient_aftercare",
        "emergency_stock",
        "operational_stock",
      ]),
    );
  });

  it("includes at least one inactive item", () => {
    expect(items.some((item) => !item.active)).toBe(true);
  });

  it("includes at least one lot-tracked and one non-lot-tracked item", () => {
    expect(items.some((item) => item.lotTracking)).toBe(true);
    expect(items.some((item) => !item.lotTracking)).toBe(true);
  });
});
