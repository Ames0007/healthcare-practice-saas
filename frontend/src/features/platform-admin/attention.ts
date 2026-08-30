import type { Subscription } from "@/components/domain/subscription/types";
import type { StatusTone } from "@/components/ui/status-badge";
import type { Tenant } from "@/components/domain/platform-admin/types";

export interface PlatformAttentionItem {
  id: string;
  /** i18n key resolved with `{ count }` (mirrors `AttentionItemData.translationKey`, `features/today/types.ts`). */
  translationKey: string;
  count: number;
  tone: StatusTone;
}

/**
 * Platform attention queue (Gate 5 §29) — only non-zero rows are returned,
 * an empty queue means nothing needs the operator's attention right now
 * rather than a wall of zeroes. Every count is a pure re-derivation of
 * `Tenant[]`/`Subscription[]`, the same arrays the dashboard/tenant/
 * subscription screens already read — never a second, independently
 * authored figure.
 */
export function computeAttentionItems(tenants: Tenant[], subscriptions: Subscription[]): PlatformAttentionItem[] {
  const expiredCount = subscriptions.filter((subscription) => subscription.status === "expired").length;
  const graceCount = subscriptions.filter((subscription) => subscription.status === "grace").length;
  const blackoutCount = subscriptions.filter((subscription) => subscription.status === "blackout").length;
  const suspendedTenantCount = tenants.filter((tenant) => tenant.status === "suspended").length;

  const items: PlatformAttentionItem[] = [];
  if (expiredCount > 0) {
    items.push({ id: "attn-expired", translationKey: "admin.dashboard.attention.expired", count: expiredCount, tone: "warning" });
  }
  if (graceCount > 0) {
    items.push({ id: "attn-grace", translationKey: "admin.dashboard.attention.grace", count: graceCount, tone: "warning" });
  }
  if (blackoutCount > 0) {
    items.push({ id: "attn-blackout", translationKey: "admin.dashboard.attention.blackout", count: blackoutCount, tone: "danger" });
  }
  if (suspendedTenantCount > 0) {
    items.push({ id: "attn-suspended", translationKey: "admin.dashboard.attention.suspended", count: suspendedTenantCount, tone: "danger" });
  }
  return items;
}
