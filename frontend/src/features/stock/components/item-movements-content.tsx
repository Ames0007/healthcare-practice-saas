"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Toast } from "@/components/ui/toast";
import { STOCK_MOVEMENT_TYPE_MAP } from "@/components/domain/stock/movement-type";
import { STOCK_MOVEMENT_REASON_MAP } from "@/components/domain/stock/movement-reason";
import type { InventoryItem, InventoryLot, StockMovement, StockMovementType } from "@/components/domain/stock/types";
import { MOCK_BUSINESS_DATE } from "@/features/today/mock-data";
import { STOCK_UNIT_MAP } from "@/components/domain/stock/unit";
import { buildMovementHistory, getMovementsForItem } from "@/features/stock/movements";
import { formatDayMonthYear } from "@/features/stock/format";
import { StockMovementFormDialog } from "./stock-movement-form-dialog";

export interface ItemMovementsContentProps {
  item: InventoryItem;
  lots: InventoryLot[];
  movements: StockMovement[];
  onMovementsChange: (movements: StockMovement[]) => void;
  onLotsChange: (lots: InventoryLot[]) => void;
}

const ACTION_TYPES: StockMovementType[] = ["in", "out", "adjustment"];

/** The "Mouvements" tab (UI-008ABCD §17, Spec #9 Screen 40) — history with a running balance, plus the three bounded actions. */
export function ItemMovementsContent({ item, lots, movements, onMovementsChange, onLotsChange }: ItemMovementsContentProps) {
  const { t, locale } = useLocale();
  const [activeDialogType, setActiveDialogType] = useState<StockMovementType | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dialogKey, setDialogKey] = useState(0);

  const itemLots = lots.filter((lot) => lot.itemId === item.id);
  const itemMovements = getMovementsForItem(movements, item.id);
  const history = buildMovementHistory(itemMovements);
  const unitLabel = t(STOCK_UNIT_MAP[item.unit].translationKey);

  function openDialog(type: StockMovementType) {
    setActiveDialogType(type);
    setDialogKey((key) => key + 1);
  }

  function handleSubmit(movement: StockMovement, newLot?: InventoryLot) {
    if (newLot) onLotsChange([...lots, newLot]);
    onMovementsChange([...movements, movement]);
    setActiveDialogType(null);
    setToastMessage(t("stock.itemDetail.movements.toast.recorded"));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        {ACTION_TYPES.map((type) => (
          <Button key={type} type="button" variant="outline" size="sm" onClick={() => openDialog(type)}>
            {t(STOCK_MOVEMENT_TYPE_MAP[type].translationKey)}
          </Button>
        ))}
      </div>

      {history.length === 0 ? (
        <EmptyState title={t("stock.itemDetail.movements.emptyTitle")} description={t("stock.itemDetail.movements.emptyDescription")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
                <th className="px-4 py-3 text-start">{t("stock.movements.table.date")}</th>
                <th className="px-4 py-3 text-start">{t("stock.movements.table.type")}</th>
                <th className="px-4 py-3 text-start">{t("stock.movements.table.quantity")}</th>
                <th className="hidden px-4 py-3 text-start lg:table-cell">{t("stock.movements.table.reason")}</th>
                {item.lotTracking && <th className="hidden px-4 py-3 text-start lg:table-cell">{t("stock.lots.table.lotNumber")}</th>}
                <th className="px-4 py-3 text-start">{t("stock.movements.table.balanceAfter")}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => {
                const typeMeta = STOCK_MOVEMENT_TYPE_MAP[row.movement.type];
                const lot = row.movement.lotId ? itemLots.find((candidate) => candidate.id === row.movement.lotId) : undefined;
                const signedQuantity = row.movement.direction === "in" ? `+${row.movement.quantity}` : `-${row.movement.quantity}`;

                return (
                  <tr key={row.movement.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-text-secondary" dir="ltr">
                      {formatDayMonthYear(row.movement.date, locale)}
                    </td>
                    <td className="px-4 py-3 text-text">{t(typeMeta.translationKey)}</td>
                    <td className={`px-4 py-3 font-medium tabular-nums ${row.movement.direction === "in" ? "text-success" : "text-danger"}`} dir="ltr">
                      {signedQuantity}
                    </td>
                    <td className="hidden px-4 py-3 text-text-secondary lg:table-cell">{t(STOCK_MOVEMENT_REASON_MAP[row.movement.reason].translationKey)}</td>
                    {item.lotTracking && (
                      <td className="hidden px-4 py-3 text-text-secondary lg:table-cell" dir="ltr">
                        {lot?.lotNumber ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 tabular-nums text-text" dir="ltr">
                      {row.balanceAfter} {unitLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeDialogType && (
        <StockMovementFormDialog
          key={dialogKey}
          open={activeDialogType !== null}
          onClose={() => setActiveDialogType(null)}
          movementType={activeDialogType}
          item={item}
          lots={itemLots}
          movements={movements}
          businessDate={MOCK_BUSINESS_DATE}
          onSubmit={handleSubmit}
        />
      )}

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
