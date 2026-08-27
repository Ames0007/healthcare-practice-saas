"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { LOT_EXPIRY_STATUS_MAP } from "@/components/domain/stock/expiry-status";
import type { CabinetLotRow } from "@/features/stock/lots";
import { formatDayMonthYear } from "@/features/stock/format";

export interface StockLotsTableProps {
  rows: CabinetLotRow[];
}

/** Cabinet-wide Lots & Expirations table (UI-008ABCD §9/§11) — overflow-x-auto wrapper, mirrors every other cabinet table in this product. */
export function StockLotsTable({ rows }: StockLotsTableProps) {
  const { t, locale } = useLocale();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
            <th className="px-4 py-3 text-start">{t("stock.lots.table.article")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.lotNumber")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.stock")}</th>
            <th className="hidden px-4 py-3 text-start lg:table-cell">{t("stock.lots.table.receivedDate")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.expirationDate")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.lot.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">
                <Link href={`/app/stock/items/${row.lot.itemId}`} className="font-medium text-primary hover:underline">
                  {row.itemName}
                </Link>
              </td>
              <td className="px-4 py-3 text-text" dir="ltr">
                {row.lot.lotNumber}
              </td>
              <td className="px-4 py-3 tabular-nums text-text" dir="ltr">
                {row.balance}
              </td>
              <td className="hidden px-4 py-3 text-text-secondary lg:table-cell" dir="ltr">
                {formatDayMonthYear(row.lot.receivedDate, locale)}
              </td>
              <td className="px-4 py-3 text-text-secondary" dir="ltr">
                {row.lot.expirationDate ? formatDayMonthYear(row.lot.expirationDate, locale) : t("stock.lots.noExpiration")}
              </td>
              <td className="px-4 py-3">
                {row.expiryStatus && (
                  <StatusBadge tone={LOT_EXPIRY_STATUS_MAP[row.expiryStatus].tone}>{t(LOT_EXPIRY_STATUS_MAP[row.expiryStatus].translationKey)}</StatusBadge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
