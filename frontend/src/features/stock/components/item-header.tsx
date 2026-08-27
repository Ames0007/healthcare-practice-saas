"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { INVENTORY_CATEGORY_MAP } from "@/components/domain/stock/category";
import { STOCK_ATTENTION_STATUS_MAP } from "@/components/domain/stock/attention-status";
import type { InventoryItem, StockAttentionStatus } from "@/components/domain/stock/types";

export interface ItemHeaderProps {
  item: InventoryItem;
  balance: number;
  attentionStatus: StockAttentionStatus;
}

/** Persistent item 360° identity/context header, mirrors `TeamMemberHeader`'s role at the top of every tab. */
export function ItemHeader({ item, balance, attentionStatus }: ItemHeaderProps) {
  const { t } = useLocale();
  const categoryMeta = INVENTORY_CATEGORY_MAP[item.category];
  const statusMeta = STOCK_ATTENTION_STATUS_MAP[attentionStatus];
  const CategoryIcon = categoryMeta.icon;

  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span aria-hidden="true" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CategoryIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-text">{item.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {t(categoryMeta.translationKey)}
              {!item.active && (
                <>
                  {" "}
                  <span aria-hidden="true">·</span> <span>{t("stock.itemDetail.inactiveNotice")}</span>
                </>
              )}
            </p>
            <p className="text-xs text-text-muted" dir="ltr">
              {item.itemNumber}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
          <p className="text-sm tabular-nums text-text-secondary" dir="ltr">
            {balance}
          </p>
        </div>
      </div>
    </Card>
  );
}
