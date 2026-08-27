import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { buildItemRows, type ItemRow } from "./items";
import { computeDaysUntil, getExpiryAttentionLots, type LotAttentionRow } from "./lots";

/** Same 30-day operational window as the expiry-alert horizon (`EXPIRY_WARNING_HORIZON_DAYS`) — kept as one shared rolling-window concept rather than a second independent constant. */
const MOVEMENT_VOLUME_WINDOW_DAYS = 30;

export interface StockKpis {
  /** Items at or below their own configured minimum stock (out_of_stock/critical/low) — Spec #2 §42.5 "Low-stock items". */
  lowStockItemsCount: number;
  /** Expired or expiring-soon lots that still hold remaining quantity (Spec #2 §42.5 "Expiring lots"). */
  expiringLotsCount: number;
  /** Movements recorded within the last 30 days (Spec #2 §42.5 "Stock movement volume"). */
  movementVolumeCount: number;
}

const LOW_STOCK_STATUSES = new Set(["out_of_stock", "critical", "low"]);

/** Cabinet-wide Stock KPIs (Spec #2 §42.5) — the exact three the spec defines, no invented fourth metric. */
export function computeStockKpis(items: InventoryItem[], lots: InventoryLot[], movements: StockMovement[], businessDate: string): StockKpis {
  const rows = buildItemRows(items, movements);
  const lowStockItemsCount = rows.filter((row) => LOW_STOCK_STATUSES.has(row.attentionStatus)).length;
  const expiringLotsCount = getExpiryAttentionLots(lots, movements, businessDate).length;
  const movementVolumeCount = movements.filter((movement) => {
    const days = computeDaysUntil(businessDate, movement.date);
    return days >= 0 && days <= MOVEMENT_VOLUME_WINDOW_DAYS;
  }).length;

  return { lowStockItemsCount, expiringLotsCount, movementVolumeCount };
}

/** Items needing stock attention (any status but "available"), worst-first — reuses `buildItemRows`'s own severity ordering, never a second ranking. */
export function getAttentionItems(items: InventoryItem[], movements: StockMovement[]): ItemRow[] {
  return buildItemRows(items, movements).filter((row) => row.attentionStatus !== "available");
}

export interface DashboardExpiryAttentionRow extends LotAttentionRow {
  itemId: string;
  itemName: string;
}

/** Same rows as `getExpiryAttentionLots`, enriched with the owning item's name for dashboard display/links — never a second, independent expiry derivation. */
export function getExpiryAttentionForDashboard(items: InventoryItem[], lots: InventoryLot[], movements: StockMovement[], businessDate: string): DashboardExpiryAttentionRow[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  return getExpiryAttentionLots(lots, movements, businessDate).map((row) => {
    const item = itemById.get(row.lot.itemId);
    return { ...row, itemId: row.lot.itemId, itemName: item?.name ?? row.lot.itemId };
  });
}
