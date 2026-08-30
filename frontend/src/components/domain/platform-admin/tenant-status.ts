import type { StatusTone } from "@/components/ui/status-badge";
import type { TenantStatus } from "./types";

interface TenantStatusMeta {
  tone: StatusTone;
  translationKey: string;
}

/** Spec #4 §5.1 `tenants.status` ENUM, verbatim — mirrors `SUBSCRIPTION_STATUS_MAP`'s own pattern (`components/domain/subscription/subscription-status.ts`). `suspended` is `warning` (an administrative restriction, still reversible); `closed` is `neutral` (an ended state, no action ever offered from it). */
export const TENANT_STATUS_MAP: Record<TenantStatus, TenantStatusMeta> = {
  active: { tone: "success", translationKey: "admin.tenants.status.active" },
  suspended: { tone: "warning", translationKey: "admin.tenants.status.suspended" },
  closed: { tone: "neutral", translationKey: "admin.tenants.status.closed" },
};
