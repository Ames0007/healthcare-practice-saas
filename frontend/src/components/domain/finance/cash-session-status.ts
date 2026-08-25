import type { StatusTone } from "@/components/ui/status-badge";
import type { CashSessionStatus } from "./types";

interface CashSessionStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central Caisse status → tone/label registry (UI-006C §18/§23), mirroring `invoice-status.ts`/`payment-status.ts`'s pattern. */
export const CASH_SESSION_STATUS_MAP: Record<CashSessionStatus, CashSessionStatusMeta> = {
  closed: { tone: "neutral", translationKey: "finance.caisse.status.closed" },
  open: { tone: "success", translationKey: "finance.caisse.status.open" },
};
