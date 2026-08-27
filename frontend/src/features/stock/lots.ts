import type { InventoryItem, InventoryLot, LotExpiryStatus, StockMovement } from "@/components/domain/stock/types";

/**
 * Lot balance — always derived live from movements (see the
 * balance-discipline note in `components/domain/stock/types.ts`), never
 * a stored field. For a lot-tracked item, every movement carries a
 * `lotId`, so summing every lot's own balance equals the item's own
 * `computeItemStockBalance` total (proven by `cross-inventory-integrity.test.ts`).
 */
export function computeLotBalance(movements: StockMovement[], lotId: string): number {
  return movements
    .filter((movement) => movement.lotId === lotId)
    .reduce((total, movement) => total + (movement.direction === "in" ? movement.quantity : -movement.quantity), 0);
}

/**
 * The approved specs list "Expiration warning horizon" as an open policy
 * question (Spec #3 §"Open questions" #16) with no numeric value chosen
 * yet. 30 days is a common pharmacy/medical-stock convention, used here
 * as an explicit prototype default pending real configuration — recorded
 * as an assumption, not silently invented (see ADR-006).
 */
export const EXPIRY_WARNING_HORIZON_DAYS = 30;

/** Whole calendar days from `fromIso` to `dateIso` (positive = in the future). Both are `YYYY-MM-DD`, parsed as UTC midnight to avoid timezone drift (mirrors `getWeekdayFromIso`'s own parsing convention). */
export function computeDaysUntil(dateIso: string, fromIso: string): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((Date.parse(`${dateIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / MS_PER_DAY);
}

/** `null` when the lot has no expiration date (a lot-tracked item that does not track expiration). */
export function resolveLotExpiryStatus(expirationDate: string | undefined, businessDate: string): LotExpiryStatus | null {
  if (!expirationDate) return null;
  const daysUntil = computeDaysUntil(expirationDate, businessDate);
  if (daysUntil < 0) return "expired";
  if (daysUntil <= EXPIRY_WARNING_HORIZON_DAYS) return "expiring_soon";
  return "valid";
}

export function getLotsForItem(lots: InventoryLot[], itemId: string): InventoryLot[] {
  return lots.filter((lot) => lot.itemId === itemId);
}

/** Earliest expiration first — undated lots (no expiration tracking) sort last. */
export function sortLotsByExpiration(lots: InventoryLot[]): InventoryLot[] {
  return [...lots].sort((a, b) => {
    if (!a.expirationDate && !b.expirationDate) return a.lotNumber.localeCompare(b.lotNumber);
    if (!a.expirationDate) return 1;
    if (!b.expirationDate) return -1;
    return a.expirationDate.localeCompare(b.expirationDate);
  });
}

export interface LotRow {
  lot: InventoryLot;
  balance: number;
  /** `null` for a lot with no expiration date (item does not track expiration). */
  expiryStatus: LotExpiryStatus | null;
}

/** One tier per `LotExpiryStatus` — worst first; `null` (no expiration tracked) sorts last. */
const EXPIRY_PRIORITY_RANK: Record<LotExpiryStatus, number> = { expired: 0, expiring_soon: 1, valid: 2 };

/** Every lot, worst-expiry-first — the full Lots & Expirations browsing list (UI-008ABCD §11), as opposed to `getExpiryAttentionLots`'s narrower actionable-alert subset. */
export function buildLotRows(lots: InventoryLot[], movements: StockMovement[], businessDate: string): LotRow[] {
  const rows: LotRow[] = lots.map((lot) => ({
    lot,
    balance: computeLotBalance(movements, lot.id),
    expiryStatus: resolveLotExpiryStatus(lot.expirationDate, businessDate),
  }));

  return rows.sort((a, b) => {
    const rankA = a.expiryStatus ? EXPIRY_PRIORITY_RANK[a.expiryStatus] : 3;
    const rankB = b.expiryStatus ? EXPIRY_PRIORITY_RANK[b.expiryStatus] : 3;
    if (rankA !== rankB) return rankA - rankB;
    if (a.lot.expirationDate && b.lot.expirationDate) return a.lot.expirationDate.localeCompare(b.lot.expirationDate);
    return a.lot.lotNumber.localeCompare(b.lot.lotNumber);
  });
}

export interface CabinetLotRow extends LotRow {
  itemName: string;
}

/** Cabinet-wide Lots & Expirations workspace rows (UI-008ABCD §9/§11) — every lot across every item, with its own item's name for display/search. */
export function buildCabinetLotRows(items: InventoryItem[], lots: InventoryLot[], movements: StockMovement[], businessDate: string): CabinetLotRow[] {
  const itemNameById = new Map(items.map((item) => [item.id, item.name]));
  return buildLotRows(lots, movements, businessDate).map((row) => ({ ...row, itemName: itemNameById.get(row.lot.itemId) ?? row.lot.itemId }));
}

export function matchesLotSearch(row: CabinetLotRow, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return row.lot.lotNumber.toLowerCase().includes(query) || row.itemName.toLowerCase().includes(query);
}

export function matchesLotExpiryFilter(row: CabinetLotRow, filter: LotExpiryStatus | "all"): boolean {
  return filter === "all" || row.expiryStatus === filter;
}

export interface LotAttentionRow {
  lot: InventoryLot;
  balance: number;
  expiryStatus: LotExpiryStatus;
}

/**
 * Cabinet-wide expiry attention (UI-008ABCD §37/WF-48) — expired or
 * expiring-soon lots that still hold remaining quantity. A depleted lot
 * (balance 0) is excluded: there is nothing left to discard or act on,
 * so it would not be an actionable alert (WF-48 §5: "user records
 * appropriate OUT/adjustment" — once that has already happened, the
 * lot's own expiry is no longer operationally relevant).
 */
export function getExpiryAttentionLots(lots: InventoryLot[], movements: StockMovement[], businessDate: string): LotAttentionRow[] {
  const rows: LotAttentionRow[] = [];

  for (const lot of lots) {
    const status = resolveLotExpiryStatus(lot.expirationDate, businessDate);
    if (status !== "expired" && status !== "expiring_soon") continue;

    const balance = computeLotBalance(movements, lot.id);
    if (balance <= 0) continue;

    rows.push({ lot, balance, expiryStatus: status });
  }

  return rows.sort((a, b) => a.lot.expirationDate!.localeCompare(b.lot.expirationDate!));
}
