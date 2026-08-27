"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { STOCK_ATTENTION_STATUS_MAP } from "@/components/domain/stock/attention-status";
import { STOCK_UNIT_MAP } from "@/components/domain/stock/unit";
import type { ItemRow } from "@/features/stock/items";

export interface AttentionItemsSectionProps {
  rows: ItemRow[];
}

/** Low/critical/reorder/out-of-stock attention list (UI-008ABCD §20, Spec #2 §42.5) — worst-first, mirrors `ReceivablesSection`'s compact-list pattern. */
export function AttentionItemsSection({ rows }: AttentionItemsSectionProps) {
  const { t } = useLocale();

  return (
    <Card>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("stock.dashboard.attentionItems.title")}</h2>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">{t("stock.dashboard.attentionItems.empty")}</p>
      ) : (
        <ul className="mt-4 flex flex-col divide-y divide-border">
          {rows.map((row) => {
            const statusMeta = STOCK_ATTENTION_STATUS_MAP[row.attentionStatus];
            return (
              <li key={row.item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <Link href={`/app/stock/items/${row.item.id}`} className="font-medium text-primary hover:underline">
                    {row.item.name}
                  </Link>
                  <p className="text-xs text-text-muted" dir="ltr">
                    {row.balance} {t(STOCK_UNIT_MAP[row.item.unit].translationKey)} / {row.item.stockPolicy.minimumStock}
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
