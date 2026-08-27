import type { InventoryItem, InventoryLot, StockMovement } from "@/components/domain/stock/types";
import type { StockReportKpis } from "@/components/domain/reports/types";
import { buildItemRows } from "@/features/stock/items";
import { getExpiryAttentionLots } from "@/features/stock/lots";

/**
 * Cabinet-wide inventory attention KPIs for the report (Spec #2 §42.5),
 * reusing the exact same `buildItemRows`/`getExpiryAttentionLots` rows
 * Stock's own dashboard reads (`features/stock/dashboard.ts`) — only the
 * grouping differs (out-of-stock split out from critical/low, see
 * `StockReportKpis`'s own doc comment), never a second balance/attention
 * derivation.
 */
export function computeStockReportKpis(
  items: InventoryItem[],
  lots: InventoryLot[],
  movements: StockMovement[],
  businessDate: string,
): StockReportKpis {
  const rows = buildItemRows(items, movements);
  const outOfStockCount = rows.filter((row) => row.attentionStatus === "out_of_stock").length;
  const lowStockCount = rows.filter((row) => row.attentionStatus === "critical" || row.attentionStatus === "low").length;
  const expiringLotsCount = getExpiryAttentionLots(lots, movements, businessDate).length;

  return { outOfStockCount, lowStockCount, expiringLotsCount };
}
