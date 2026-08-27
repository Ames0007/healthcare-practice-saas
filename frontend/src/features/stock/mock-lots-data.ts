import type { InventoryLot } from "@/components/domain/stock/types";

/**
 * Centralized lot/batch fixtures (UI-008ABCD §8) — one entry per lot for
 * every `lotTracking` item in `mock-items-data.ts`. No `currentQuantity`
 * field (balance is always derived from `mock-movements-data.ts`, see the
 * balance-discipline note in `components/domain/stock/types.ts`).
 *
 * `item-12` and `item-13` deliberately carry two lots each: `item-12`
 * proves multi-lot balance aggregation (§64-style cross-check), and
 * `item-13` proves an expired lot can still hold remaining quantity while
 * the item overall looks healthy — an expiry alert (Gate 4) that a
 * stock-level alert alone would never surface (relative to
 * MOCK_BUSINESS_DATE = 2026-08-27: expired 2026-08-01, item balance 40 is
 * comfortably above its minimum of 15).
 */
export function getInventoryLotsMockData(): InventoryLot[] {
  return [
    { id: "lot-02-1", itemId: "item-02", lotNumber: "LOT-2026-0102", receivedDate: "2026-08-05", expirationDate: "2026-09-16" },
    { id: "lot-04-1", itemId: "item-04", lotNumber: "LOT-2026-0201", receivedDate: "2026-07-10", expirationDate: "2027-07-10" },
    { id: "lot-05-1", itemId: "item-05", lotNumber: "LOT-2026-0301", receivedDate: "2026-08-01", expirationDate: "2026-12-01" },
    { id: "lot-06-1", itemId: "item-06", lotNumber: "LOT-2026-0401", receivedDate: "2026-07-15", expirationDate: "2026-09-10" },
    { id: "lot-07-1", itemId: "item-07", lotNumber: "LOT-2026-0501", receivedDate: "2026-06-01", expirationDate: "2026-08-15" },
    { id: "lot-08-1", itemId: "item-08", lotNumber: "LOT-2026-0601", receivedDate: "2026-08-10", expirationDate: "2026-11-10" },
    { id: "lot-09-1", itemId: "item-09", lotNumber: "LOT-2026-0701", receivedDate: "2026-07-20", expirationDate: "2027-01-20" },
    { id: "lot-12-1", itemId: "item-12", lotNumber: "LOT-2026-0801", receivedDate: "2026-07-01", expirationDate: "2026-09-05" },
    { id: "lot-12-2", itemId: "item-12", lotNumber: "LOT-2026-0802", receivedDate: "2026-08-15", expirationDate: "2027-02-15" },
    { id: "lot-13-1", itemId: "item-13", lotNumber: "LOT-2026-0901", receivedDate: "2026-06-15", expirationDate: "2026-08-01" },
    { id: "lot-13-2", itemId: "item-13", lotNumber: "LOT-2026-0902", receivedDate: "2026-08-10", expirationDate: "2027-03-01" },
    { id: "lot-14-1", itemId: "item-14", lotNumber: "LOT-2026-1001", receivedDate: "2026-08-05", expirationDate: "2026-10-05" },
    { id: "lot-18-1", itemId: "item-18", lotNumber: "LOT-2026-1101", receivedDate: "2026-07-25", expirationDate: "2027-01-25" },
    { id: "lot-22-1", itemId: "item-22", lotNumber: "LOT-2026-1201", receivedDate: "2026-06-01", expirationDate: "2028-06-01" },
  ];
}
