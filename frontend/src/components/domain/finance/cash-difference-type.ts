import type { StatusTone } from "@/components/ui/status-badge";
import type { CashDifferenceType } from "./types";

interface CashDifferenceTypeMeta {
  tone: StatusTone;
  translationKey: string;
}

/**
 * Central Caisse-closing difference → tone/label registry (UI-006E
 * §14-17), mirroring `cash-session-status.ts`'s pattern. Overage
 * deliberately uses `warning`, not `success` — a positive discrepancy is
 * still an anomaly requiring explanation, never "good news" (§17).
 */
export const CASH_DIFFERENCE_TYPE_MAP: Record<CashDifferenceType, CashDifferenceTypeMeta> = {
  balanced: { tone: "success", translationKey: "finance.caisse.closing.balanced" },
  shortage: { tone: "danger", translationKey: "finance.caisse.closing.discrepancy" },
  overage: { tone: "warning", translationKey: "finance.caisse.closing.discrepancy" },
};
