"use client";

import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { LOT_EXPIRY_STATUS_MAP } from "@/components/domain/stock/expiry-status";
import type { InventoryLot, StockMovement } from "@/components/domain/stock/types";
import { buildLotRows, sortLotsByExpiration } from "@/features/stock/lots";
import { formatDayMonthYear } from "@/features/stock/format";

export interface ItemLotsContentProps {
  itemId: string;
  unitLabel: string;
  lots: InventoryLot[];
  movements: StockMovement[];
  businessDate: string;
}

/** The "Lots" tab (UI-008ABCD §11/§37) — read-only: lots are created through Stock IN (Gate 3), never a standalone "add lot" form here. */
export function ItemLotsContent({ itemId, unitLabel, lots, movements, businessDate }: ItemLotsContentProps) {
  const { t, locale } = useLocale();

  const itemLots = sortLotsByExpiration(lots.filter((lot) => lot.itemId === itemId));

  if (itemLots.length === 0) {
    return <EmptyState title={t("stock.itemDetail.lots.emptyTitle")} description={t("stock.itemDetail.lots.emptyDescription")} />;
  }

  const rows = buildLotRows(itemLots, movements, businessDate);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
            <th className="px-4 py-3 text-start">{t("stock.lots.table.lotNumber")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.stock")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.receivedDate")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.expirationDate")}</th>
            <th className="px-4 py-3 text-start">{t("stock.lots.table.status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.lot.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 font-medium text-text" dir="ltr">
                {row.lot.lotNumber}
              </td>
              <td className="px-4 py-3 tabular-nums text-text" dir="ltr">
                {row.balance} {unitLabel}
              </td>
              <td className="px-4 py-3 text-text-secondary" dir="ltr">
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
