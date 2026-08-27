import type { StatusTone } from "@/components/ui/status-badge";
import type { LotExpiryStatus } from "./types";

interface LotExpiryStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Central lot-expiry status → tone/label registry (UI-008ABCD §37), mirroring `attention-status.ts`'s pattern. Ordered worst to best. */
export const LOT_EXPIRY_STATUS_MAP: Record<LotExpiryStatus, LotExpiryStatusMeta> = {
  expired: { tone: "danger", translationKey: "stock.expiryStatus.expired" },
  expiring_soon: { tone: "warning", translationKey: "stock.expiryStatus.expiring_soon" },
  valid: { tone: "success", translationKey: "stock.expiryStatus.valid" },
};

export const LOT_EXPIRY_STATUS_ORDER: LotExpiryStatus[] = ["expired", "expiring_soon", "valid"];
