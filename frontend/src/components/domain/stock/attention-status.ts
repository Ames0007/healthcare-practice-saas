import type { StatusTone } from "@/components/ui/status-badge";
import type { StockAttentionStatus } from "./types";

interface StockAttentionStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central stock-attention status → tone/label registry (UI-008ABCD §24), mirroring `invoice-status.ts`'s pattern. Ordered worst to best. */
export const STOCK_ATTENTION_STATUS_MAP: Record<StockAttentionStatus, StockAttentionStatusMeta> = {
  out_of_stock: { tone: "danger", translationKey: "stock.attentionStatus.out_of_stock" },
  critical: { tone: "danger", translationKey: "stock.attentionStatus.critical" },
  low: { tone: "warning", translationKey: "stock.attentionStatus.low" },
  reorder: { tone: "info", translationKey: "stock.attentionStatus.reorder" },
  available: { tone: "success", translationKey: "stock.attentionStatus.available" },
};

export const STOCK_ATTENTION_STATUS_ORDER: StockAttentionStatus[] = ["out_of_stock", "critical", "low", "reorder", "available"];
