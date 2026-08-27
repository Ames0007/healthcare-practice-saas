"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { LOT_EXPIRY_STATUS_MAP } from "@/components/domain/stock/expiry-status";
import { formatDayMonthYear } from "@/features/stock/format";
import type { DashboardExpiryAttentionRow } from "@/features/stock/dashboard";

export interface ExpiryAttentionSectionProps {
  rows: DashboardExpiryAttentionRow[];
}

/** Expired/expiring-soon lots with remaining quantity (UI-008ABCD §21, WF-48) — worst-first, mirrors `AttentionItemsSection`'s exact layout. */
export function ExpiryAttentionSection({ rows }: ExpiryAttentionSectionProps) {
  const { t, locale } = useLocale();

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("stock.dashboard.expiryAttention.title")}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">{t("stock.dashboard.expiryAttention.empty")}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {rows.map((row) => {
            const statusMeta = LOT_EXPIRY_STATUS_MAP[row.expiryStatus];
            return (
              <li key={row.lot.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/app/stock/items/${row.itemId}`} className="font-medium text-primary hover:underline">
                    {row.itemName}
                  </Link>
                  <p className="text-xs text-text-muted" dir="ltr">
                    {row.lot.lotNumber} · {row.balance} · {formatDayMonthYear(row.lot.expirationDate!, locale)}
                  </p>
                </div>
                <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
