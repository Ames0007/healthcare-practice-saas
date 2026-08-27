import { ArrowDownToLine, ArrowUpFromLine, Scale, type LucideIcon } from "lucide-react";
import type { StockMovementType } from "./types";

interface StockMovementTypeMeta {
  translationKey: string;
  icon: LucideIcon;
}

/** Central movement type → label/icon registry (Spec #4 §23.3 `movement_type` ENUM), mirroring `category.ts`'s pattern. */
export const STOCK_MOVEMENT_TYPE_MAP: Record<StockMovementType, StockMovementTypeMeta> = {
  in: { translationKey: "stock.movementType.in", icon: ArrowDownToLine },
  out: { translationKey: "stock.movementType.out", icon: ArrowUpFromLine },
  adjustment: { translationKey: "stock.movementType.adjustment", icon: Scale },
};
