"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STOCK_MOVEMENT_REASON_MAP, REASON_OPTIONS_BY_MOVEMENT_TYPE } from "@/components/domain/stock/movement-reason";
import { STOCK_MOVEMENT_TYPE_MAP } from "@/components/domain/stock/movement-type";
import type { InventoryItem, InventoryLot, StockMovement, StockMovementFormValues, StockMovementReason } from "@/components/domain/stock/types";
import { computeLotBalance } from "@/features/stock/lots";
import { buildInitialMovementFormValues, buildMovementFromFormValues, isValidMovementQuantity, wouldCauseNegativeItemBalance, wouldCauseNegativeLotBalance } from "@/features/stock/movements";

export interface StockMovementFormDialogProps {
  open: boolean;
  onClose: () => void;
  movementType: "in" | "out" | "adjustment";
  item: InventoryItem;
  lots: InventoryLot[];
  movements: StockMovement[];
  businessDate: string;
  onSubmit: (movement: StockMovement, newLot?: InventoryLot) => void;
}

/**
 * Shared Stock IN/OUT/Adjustment prototype dialog (UI-008ABCD §14-16,
 * WF-44/45/46) — one component reused by all three actions (mirrors
 * `ItemFormDialog`'s single-dialog-for-add-and-edit shape), since the
 * fields overlap heavily and only reason vocabulary/lot handling differ
 * by type. Negative stock is disallowed (ADR-006): an OUT/adjustment-out
 * that would drive the item's or the selected lot's own balance below
 * zero is blocked before submit, never silently clamped.
 */
export function StockMovementFormDialog({ open, onClose, movementType, item, lots, movements, businessDate, onSubmit }: StockMovementFormDialogProps) {
  const { t } = useLocale();
  const reasonOptions = REASON_OPTIONS_BY_MOVEMENT_TYPE[movementType];
  const initial = buildInitialMovementFormValues(movementType, reasonOptions[0], businessDate);

  const [quantity, setQuantity] = useState(initial.quantity);
  const [date, setDate] = useState(initial.date);
  const [reason, setReason] = useState<StockMovementReason>(initial.reason);
  const [direction, setDirection] = useState<"in" | "out">(initial.direction);
  const [note, setNote] = useState(initial.note);
  const [lotId, setLotId] = useState(initial.lotId);
  const [newLotNumber, setNewLotNumber] = useState(initial.newLotNumber);
  const [newLotExpirationDate, setNewLotExpirationDate] = useState(initial.newLotExpirationDate);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const outgoing = movementType === "out" || (movementType === "adjustment" && direction === "out");
  const lotsWithBalance = item.lotTracking ? lots.map((lot) => ({ lot, balance: computeLotBalance(movements, lot.id) })) : [];
  const selectableLots = outgoing ? lotsWithBalance.filter((entry) => entry.balance > 0) : lotsWithBalance;

  function validate(): Record<string, string> {
    const required = t("stock.itemDetail.form.requiredError");
    const nextErrors: Record<string, string> = {};

    const quantityNumber = Number(quantity);
    if (quantity.trim() === "") {
      nextErrors.quantity = required;
    } else if (!isValidMovementQuantity(quantityNumber)) {
      nextErrors.quantity = t("stock.movementForm.quantityInvalidError");
    }

    if (!date) {
      nextErrors.date = required;
    } else if (date > businessDate) {
      nextErrors.date = t("stock.movementForm.dateInFutureError");
    }

    if (item.lotTracking) {
      if (movementType === "in") {
        if (!lotId && !newLotNumber.trim()) {
          nextErrors.lotId = t("stock.movementForm.lotRequiredError");
        }
        if (!lotId && item.expirationTracking && !newLotExpirationDate) {
          nextErrors.newLotExpirationDate = required;
        }
      } else if (!lotId) {
        nextErrors.lotId = t("stock.movementForm.lotSelectionRequiredError");
      }
    }

    if (!nextErrors.quantity && !nextErrors.lotId && outgoing) {
      if (item.lotTracking && lotId) {
        if (wouldCauseNegativeLotBalance(movements, lotId, "out", quantityNumber)) {
          nextErrors.quantity = t("stock.movementForm.insufficientStockError");
        }
      } else if (!item.lotTracking && wouldCauseNegativeItemBalance(movements, item.id, "out", quantityNumber)) {
        nextErrors.quantity = t("stock.movementForm.insufficientStockError");
      }
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const values: StockMovementFormValues = { type: movementType, direction, quantity, date, reason, note, lotId, newLotNumber, newLotExpirationDate };

    let resolvedLotId = lotId || undefined;
    let newLot: InventoryLot | undefined;
    if (item.lotTracking && movementType === "in" && !lotId && newLotNumber.trim()) {
      newLot = {
        id: `lot-${Date.now()}`,
        itemId: item.id,
        lotNumber: newLotNumber.trim(),
        receivedDate: date,
        expirationDate: item.expirationTracking ? newLotExpirationDate : undefined,
      };
      resolvedLotId = newLot.id;
    }

    const movement = buildMovementFromFormValues(`mv-${Date.now()}`, item.id, values, resolvedLotId);
    onSubmit(movement, newLot);
  }

  const typeMeta = STOCK_MOVEMENT_TYPE_MAP[movementType];
  const title = t(typeMeta.translationKey);

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("stock.itemDetail.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <p className="mt-1 text-sm text-text-muted">{item.name}</p>
        </div>

        <section className="flex flex-col gap-4">
          {movementType === "adjustment" && (
            <Select
              label={t("stock.movementForm.directionLabel")}
              required
              value={direction}
              onChange={(event) => setDirection(event.target.value as "in" | "out")}
              options={[
                { value: "in", label: t("stock.movementForm.directionIn") },
                { value: "out", label: t("stock.movementForm.directionOut") },
              ]}
            />
          )}

          <Input
            type="number"
            min="0"
            step="any"
            label={t("stock.movementForm.quantityLabel")}
            required
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            error={errors.quantity}
          />

          <Input type="date" label={t("stock.movementForm.dateLabel")} required value={date} onChange={(event) => setDate(event.target.value)} error={errors.date} />

          <Select
            label={t("stock.movementForm.reasonLabel")}
            required
            value={reason}
            onChange={(event) => setReason(event.target.value as StockMovementReason)}
            options={reasonOptions.map((option) => ({ value: option, label: t(STOCK_MOVEMENT_REASON_MAP[option].translationKey) }))}
          />

          {item.lotTracking && (
            <>
              <Select
                label={t("stock.movementForm.lotLabel")}
                required={movementType !== "in"}
                value={lotId}
                onChange={(event) => setLotId(event.target.value)}
                placeholder={movementType === "in" ? t("stock.movementForm.newLotOption") : t("stock.movementForm.selectLotPlaceholder")}
                error={errors.lotId}
                options={selectableLots.map(({ lot, balance }) => ({ value: lot.id, label: `${lot.lotNumber} (${balance})` }))}
              />

              {movementType === "in" && !lotId && (
                <>
                  <Input
                    label={t("stock.movementForm.newLotNumberLabel")}
                    value={newLotNumber}
                    onChange={(event) => setNewLotNumber(event.target.value)}
                  />
                  {item.expirationTracking && (
                    <Input
                      type="date"
                      label={t("stock.movementForm.newLotExpirationLabel")}
                      required
                      value={newLotExpirationDate}
                      onChange={(event) => setNewLotExpirationDate(event.target.value)}
                      error={errors.newLotExpirationDate}
                    />
                  )}
                </>
              )}
            </>
          )}

          <Textarea label={t("stock.movementForm.noteLabel")} value={note} onChange={(event) => setNote(event.target.value)} />
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("stock.itemDetail.form.cancel")}
          </Button>
          <Button type="submit">{t("stock.movementForm.submit")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
