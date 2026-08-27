import type { InventoryItem, StockAttentionStatus, StockMovement } from "@/components/domain/stock/types";
import { computeItemStockBalance, resolveStockAttentionStatus } from "./stock";

export interface ItemRow {
  item: InventoryItem;
  balance: number;
  attentionStatus: StockAttentionStatus;
}

/** One tier per `StockAttentionStatus` — worst first, mirrors `global-invoices.ts`'s own operational-priority convention. */
const ATTENTION_PRIORITY_RANK: Record<StockAttentionStatus, number> = {
  out_of_stock: 0,
  critical: 1,
  low: 2,
  reorder: 3,
  available: 4,
};

/** Resolves every catalog item to a display-ready row (balance + attention status derived live, never stored), ordered worst-attention-first then alphabetically within a tier. */
export function buildItemRows(items: InventoryItem[], movements: StockMovement[]): ItemRow[] {
  const rows: ItemRow[] = items.map((item) => {
    const balance = computeItemStockBalance(movements, item.id);
    return { item, balance, attentionStatus: resolveStockAttentionStatus(balance, item.stockPolicy) };
  });

  return rows.sort((a, b) => {
    const rankDiff = ATTENTION_PRIORITY_RANK[a.attentionStatus] - ATTENTION_PRIORITY_RANK[b.attentionStatus];
    return rankDiff !== 0 ? rankDiff : a.item.name.localeCompare(b.item.name, "fr");
  });
}
