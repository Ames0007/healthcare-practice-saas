import type { StockMovement, StockMovementFormValues, StockMovementReason, StockMovementType } from "@/components/domain/stock/types";
import { computeItemStockBalance } from "./stock";
import { computeLotBalance } from "./lots";

export function getMovementsForItem(movements: StockMovement[], itemId: string): StockMovement[] {
  return movements.filter((movement) => movement.itemId === itemId);
}

/** Most recent first (Spec #9 Screen 40: "23/08 Sortie -2 / 20/08 Entrée +5"). Ties broken by insertion order (stable sort) — fixtures never share two same-day movements for the same item where order would be ambiguous. */
export function sortMovementsDesc(movements: StockMovement[]): StockMovement[] {
  return [...movements].sort((a, b) => b.date.localeCompare(a.date));
}

export interface MovementHistoryRow {
  movement: StockMovement;
  /** Item balance immediately after this movement was recorded. */
  balanceAfter: number;
}

/**
 * Movement history with a running balance (UI-008ABCD §17). Computed by
 * replaying `itemMovements` in chronological order (oldest first) and
 * recording the cumulative balance after each one, then presented in the
 * reverse-chronological order the screen actually wants (mirrors
 * `computeItemStockBalance`'s own derivation — never a stored balance).
 */
export function buildMovementHistory(itemMovements: StockMovement[]): MovementHistoryRow[] {
  const chronological = [...itemMovements].sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const rows: MovementHistoryRow[] = chronological.map((movement) => {
    running += movement.direction === "in" ? movement.quantity : -movement.quantity;
    return { movement, balanceAfter: running };
  });

  return rows.reverse();
}

export function isValidMovementQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && quantity > 0;
}

/**
 * Negative-stock policy (CLAUDE.md §59 lists this as an ADR-worthy topic;
 * see ADR-006): this prototype disallows negative stock outright — an
 * OUT or negative adjustment is blocked client-side when it would drive
 * the item's own balance below zero (Spec #4 §41.3/§2632: "Prevent race
 * causing invalid negative quantity").
 */
export function wouldCauseNegativeItemBalance(movements: StockMovement[], itemId: string, direction: "in" | "out", quantity: number): boolean {
  if (direction === "in") return false;
  return computeItemStockBalance(movements, itemId) - quantity < 0;
}

/** Same negative-stock policy, scoped to one lot — an OUT cannot draw a specific lot below zero even if the item's other lots have stock. */
export function wouldCauseNegativeLotBalance(movements: StockMovement[], lotId: string, direction: "in" | "out", quantity: number): boolean {
  if (direction === "in") return false;
  return computeLotBalance(movements, lotId) - quantity < 0;
}

export function buildInitialMovementFormValues(type: StockMovementType, defaultReason: StockMovementReason, businessDate: string): StockMovementFormValues {
  return {
    type,
    direction: type === "out" ? "out" : "in",
    quantity: "",
    date: businessDate,
    reason: defaultReason,
    note: "",
    lotId: "",
    newLotNumber: "",
    newLotExpirationDate: "",
  };
}

/** Builds a full `StockMovement` from validated form values — the caller must already have validated `values` (quantity, negative-balance policy, lot selection) before calling this. */
export function buildMovementFromFormValues(id: string, itemId: string, values: StockMovementFormValues, lotId: string | undefined): StockMovement {
  return {
    id,
    itemId,
    lotId,
    type: values.type,
    direction: values.direction,
    quantity: Number(values.quantity),
    date: values.date,
    reason: values.reason,
    note: values.note.trim() || undefined,
  };
}
