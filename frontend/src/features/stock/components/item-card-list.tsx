"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonClassNames } from "@/components/ui/button";
import { INVENTORY_CATEGORY_MAP } from "@/components/domain/stock/category";
import { STOCK_UNIT_MAP } from "@/components/domain/stock/unit";
import { STOCK_ATTENTION_STATUS_MAP } from "@/components/domain/stock/attention-status";
import type { ItemRow } from "@/features/stock/items";

export interface ItemCardListProps {
  rows: ItemRow[];
}

/** Mobile compact cards, mirrors `GlobalInvoiceCardList`'s `divide-y ... md:hidden` convention exactly. */
export function ItemCardList({ rows }: ItemCardListProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col divide-y divide-border md:hidden">
      {rows.map((row) => {
        const statusMeta = STOCK_ATTENTION_STATUS_MAP[row.attentionStatus];
        const categoryMeta = INVENTORY_CATEGORY_MAP[row.item.category];

        return (
          <div key={row.item.id} className="flex flex-col gap-2 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/app/stock/items/${row.item.id}`} className="font-medium text-primary hover:underline">
                {row.item.name}
              </Link>
              <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
            </div>

            <p className="text-xs text-text-muted" dir="ltr">
              {row.item.itemNumber}
              {!row.item.active && ` · ${t("stock.items.inactiveBadge")}`}
            </p>

            <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-sm">
              <div>
                <p className="text-xs text-text-muted">{t("stock.items.table.category")}</p>
                <p className="text-text-secondary">{t(categoryMeta.translationKey)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">{t("stock.items.table.stock")}</p>
                <p className="font-medium tabular-nums text-text" dir="ltr">
                  {row.balance} {t(STOCK_UNIT_MAP[row.item.unit].translationKey)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted">{t("stock.items.table.minimum")}</p>
                <p className="tabular-nums text-text-secondary" dir="ltr">
                  {row.item.stockPolicy.minimumStock}
                </p>
              </div>
            </div>

            <Link href={`/app/stock/items/${row.item.id}`} className={buttonClassNames("outline", "sm", "w-fit")}>
              {t("stock.items.view")}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
