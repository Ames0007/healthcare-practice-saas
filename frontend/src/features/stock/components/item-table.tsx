"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { INVENTORY_CATEGORY_MAP } from "@/components/domain/stock/category";
import { STOCK_UNIT_MAP } from "@/components/domain/stock/unit";
import { STOCK_ATTENTION_STATUS_MAP } from "@/components/domain/stock/attention-status";
import type { StockAttentionStatus } from "@/components/domain/stock/types";
import type { ItemRow } from "@/features/stock/items";

export interface ItemTableProps {
  rows: ItemRow[];
}

/** Desktop table (UI-008ABCD §22) — mirrors `GlobalInvoiceTable`'s exact dual-render convention (paired with `ItemCardList` for mobile). */
export function ItemTable({ rows }: ItemTableProps) {
  const { t } = useLocale();

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
            <th className="px-4 py-3 text-start">{t("stock.items.table.article")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("stock.items.table.category")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("stock.items.table.unit")}</th>
            <th className="px-4 py-3 text-start">{t("stock.items.table.stock")}</th>
            <th className="px-4 py-3 text-start">{t("stock.items.table.minimum")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("stock.items.table.reorderPoint")}</th>
            <th className="px-4 py-3 text-start">{t("stock.items.table.status")}</th>
            <th className="px-4 py-3 text-start">
              <span className="sr-only">{t("stock.items.table.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const statusMeta = STOCK_ATTENTION_STATUS_MAP[row.attentionStatus as StockAttentionStatus];
            const categoryMeta = INVENTORY_CATEGORY_MAP[row.item.category];

            return (
              <tr key={row.item.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3">
                  <Link href={`/app/stock/items/${row.item.id}`} className="font-medium text-primary hover:underline">
                    {row.item.name}
                  </Link>
                  <p className="text-xs text-text-muted" dir="ltr">
                    {row.item.itemNumber}
                    {!row.item.active && ` · ${t("stock.items.inactiveBadge")}`}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-text-secondary lg:table-cell">{t(categoryMeta.translationKey)}</td>
                <td className="hidden px-4 py-3 text-text-secondary lg:table-cell">{t(STOCK_UNIT_MAP[row.item.unit].translationKey)}</td>
                <td className="px-4 py-3 font-medium tabular-nums text-text" dir="ltr">
                  {row.balance}
                </td>
                <td className="px-4 py-3 tabular-nums text-text-secondary" dir="ltr">
                  {row.item.stockPolicy.minimumStock}
                </td>
                <td className="hidden px-4 py-3 tabular-nums text-text-secondary lg:table-cell" dir="ltr">
                  {row.item.stockPolicy.reorderPoint ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                </td>
                <td className="px-4 py-3 text-end">
                  <Link href={`/app/stock/items/${row.item.id}`} className="text-sm font-medium text-primary hover:underline">
                    {t("stock.items.view")}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
