import type { StockMovementReason, StockMovementType } from "./types";

/** Central movement reason → label registry (UI-008ABCD §13, Spec #2 §36.2). */
export const STOCK_MOVEMENT_REASON_MAP: Record<StockMovementReason, { translationKey: string }> = {
  stock_received: { translationKey: "stock.movementReason.stock_received" },
  returned_to_stock: { translationKey: "stock.movementReason.returned_to_stock" },
  initial_stock: { translationKey: "stock.movementReason.initial_stock" },
  used_for_care: { translationKey: "stock.movementReason.used_for_care" },
  expired_discarded: { translationKey: "stock.movementReason.expired_discarded" },
  damaged_or_lost: { translationKey: "stock.movementReason.damaged_or_lost" },
  internal_use: { translationKey: "stock.movementReason.internal_use" },
  inventory_correction: { translationKey: "stock.movementReason.inventory_correction" },
  other: { translationKey: "stock.movementReason.other" },
};

/** Bounded reason vocabulary per movement type (UI-008ABCD §13) — a Stock IN cannot be reasoned "used_for_care", an OUT cannot be "stock_received", etc. */
export const REASON_OPTIONS_BY_MOVEMENT_TYPE: Record<StockMovementType, StockMovementReason[]> = {
  in: ["stock_received", "returned_to_stock", "initial_stock", "other"],
  out: ["used_for_care", "expired_discarded", "damaged_or_lost", "internal_use", "other"],
  adjustment: ["inventory_correction", "other"],
};
