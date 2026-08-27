import type { StockUnit } from "./types";

/** Central stock-unit → label registry (UI-008ABCD §15). No icon axis — units are text-only everywhere they render. */
export const STOCK_UNIT_MAP: Record<StockUnit, { translationKey: string }> = {
  unit: { translationKey: "stock.unit.unit" },
  box: { translationKey: "stock.unit.box" },
  pack: { translationKey: "stock.unit.pack" },
  bottle: { translationKey: "stock.unit.bottle" },
  vial: { translationKey: "stock.unit.vial" },
  tube: { translationKey: "stock.unit.tube" },
  roll: { translationKey: "stock.unit.roll" },
  bag: { translationKey: "stock.unit.bag" },
  kit: { translationKey: "stock.unit.kit" },
  pair: { translationKey: "stock.unit.pair" },
};

export const STOCK_UNIT_ORDER: StockUnit[] = ["unit", "box", "pack", "bottle", "vial", "tube", "roll", "bag", "kit", "pair"];
