import type { StockMovement } from "@/components/domain/stock/types";

/**
 * Centralized stock movement history (UI-008ABCD §13/§17-18) — the sole
 * source of truth every item/lot balance is derived from (see the
 * balance-discipline note in `components/domain/stock/types.ts`). Every
 * one of the nine `StockMovementReason` values and both movement
 * directions on `adjustment` appear at least once. Dates are all in the
 * past relative to `MOCK_BUSINESS_DATE` (2026-08-27, `features/today/mock-data.ts`).
 *
 * Net balance per item (verified by `mock-movements-data.test.ts` against
 * `computeItemStockBalance`): item-01=20, item-02=18 (the task's own
 * worked example), item-03=8, item-04=3, item-05=20, item-06=10,
 * item-07=0, item-08=6, item-09=12, item-10=15, item-11=5, item-12=2
 * (lot-12-1=1 + lot-12-2=1), item-13=40 (lot-13-1=5 + lot-13-2=35),
 * item-14=7, item-15=30, item-16=3, item-17=8, item-18=25, item-19=8,
 * item-20=20, item-21=0, item-22=4, item-23=10, item-24=4.
 */
export function getStockMovementsMockData(): StockMovement[] {
  return [
    // item-01 — Gants nitrile M (no lot)
    { id: "mv-01-1", itemId: "item-01", type: "in", direction: "in", quantity: 30, date: "2026-08-01", reason: "initial_stock" },
    { id: "mv-01-2", itemId: "item-01", type: "out", direction: "out", quantity: 10, date: "2026-08-15", reason: "used_for_care" },

    // item-02 — Compresses stériles 10×10 (lot-02-1) — the task's own worked example, balance 18
    { id: "mv-02-1", itemId: "item-02", lotId: "lot-02-1", type: "in", direction: "in", quantity: 25, date: "2026-08-05", reason: "stock_received", recordedBy: "Meryem Bakkali" },
    { id: "mv-02-2", itemId: "item-02", lotId: "lot-02-1", type: "out", direction: "out", quantity: 7, date: "2026-08-20", reason: "used_for_care" },

    // item-03 — Seringues 5 ml (no lot)
    { id: "mv-03-1", itemId: "item-03", type: "in", direction: "in", quantity: 20, date: "2026-07-20", reason: "stock_received" },
    { id: "mv-03-2", itemId: "item-03", type: "out", direction: "out", quantity: 12, date: "2026-08-18", reason: "used_for_care" },

    // item-04 — Cathéters IV 20G (lot-04-1)
    { id: "mv-04-1", itemId: "item-04", lotId: "lot-04-1", type: "in", direction: "in", quantity: 15, date: "2026-07-10", reason: "stock_received" },
    { id: "mv-04-2", itemId: "item-04", lotId: "lot-04-1", type: "out", direction: "out", quantity: 8, date: "2026-08-15", reason: "used_for_care" },
    { id: "mv-04-3", itemId: "item-04", lotId: "lot-04-1", type: "out", direction: "out", quantity: 4, date: "2026-08-22", reason: "damaged_or_lost", note: "Carton endommagé à la réception" },

    // item-05 — Sérum physiologique 500 ml (lot-05-1)
    { id: "mv-05-1", itemId: "item-05", lotId: "lot-05-1", type: "in", direction: "in", quantity: 20, date: "2026-08-01", reason: "stock_received" },

    // item-06 — Lidocaïne 2 % (lot-06-1)
    { id: "mv-06-1", itemId: "item-06", lotId: "lot-06-1", type: "in", direction: "in", quantity: 14, date: "2026-07-15", reason: "stock_received" },
    { id: "mv-06-2", itemId: "item-06", lotId: "lot-06-1", type: "out", direction: "out", quantity: 4, date: "2026-08-10", reason: "used_for_care" },

    // item-07 — Antiseptique Bétadine (lot-07-1) — fully consumed AND its lot has since expired
    { id: "mv-07-1", itemId: "item-07", lotId: "lot-07-1", type: "in", direction: "in", quantity: 12, date: "2026-06-01", reason: "stock_received" },
    { id: "mv-07-2", itemId: "item-07", lotId: "lot-07-1", type: "out", direction: "out", quantity: 12, date: "2026-08-05", reason: "expired_discarded", note: "Flacon périmé, mis au rebut" },

    // item-08 — Vaccin antitétanique (lot-08-1)
    { id: "mv-08-1", itemId: "item-08", lotId: "lot-08-1", type: "in", direction: "in", quantity: 6, date: "2026-08-10", reason: "stock_received" },

    // item-09 — Fils de suture résorbables (lot-09-1)
    { id: "mv-09-1", itemId: "item-09", lotId: "lot-09-1", type: "in", direction: "in", quantity: 18, date: "2026-07-20", reason: "stock_received" },
    { id: "mv-09-2", itemId: "item-09", lotId: "lot-09-1", type: "out", direction: "out", quantity: 8, date: "2026-08-12", reason: "used_for_care" },
    { id: "mv-09-3", itemId: "item-09", lotId: "lot-09-1", type: "in", direction: "in", quantity: 2, date: "2026-08-18", reason: "returned_to_stock", note: "Retour salle de soins" },

    // item-10 — Gel échographie (no lot)
    { id: "mv-10-1", itemId: "item-10", type: "in", direction: "in", quantity: 15, date: "2026-07-25", reason: "stock_received" },
    { id: "mv-10-2", itemId: "item-10", type: "out", direction: "out", quantity: 3, date: "2026-08-10", reason: "other", note: "Sortie exceptionnelle" },
    { id: "mv-10-3", itemId: "item-10", type: "in", direction: "in", quantity: 3, date: "2026-08-20", reason: "stock_received" },

    // item-11 — Électrodes ECG (no lot)
    { id: "mv-11-1", itemId: "item-11", type: "in", direction: "in", quantity: 12, date: "2026-07-25", reason: "stock_received" },
    { id: "mv-11-2", itemId: "item-11", type: "adjustment", direction: "in", quantity: 2, date: "2026-08-05", reason: "inventory_correction", note: "Comptage : unités retrouvées" },
    { id: "mv-11-3", itemId: "item-11", type: "out", direction: "out", quantity: 9, date: "2026-08-19", reason: "used_for_care" },

    // item-12 — Tests rapides (bandelettes) — two lots
    { id: "mv-12-1", itemId: "item-12", lotId: "lot-12-1", type: "in", direction: "in", quantity: 3, date: "2026-07-01", reason: "stock_received" },
    { id: "mv-12-2", itemId: "item-12", lotId: "lot-12-1", type: "out", direction: "out", quantity: 2, date: "2026-08-20", reason: "used_for_care" },
    { id: "mv-12-3", itemId: "item-12", lotId: "lot-12-2", type: "in", direction: "in", quantity: 1, date: "2026-08-15", reason: "stock_received" },

    // item-13 — Tubes de prélèvement — two lots, one already expired but still holding quantity
    { id: "mv-13-1", itemId: "item-13", lotId: "lot-13-1", type: "in", direction: "in", quantity: 10, date: "2026-06-15", reason: "stock_received" },
    { id: "mv-13-2", itemId: "item-13", lotId: "lot-13-1", type: "out", direction: "out", quantity: 5, date: "2026-07-30", reason: "used_for_care" },
    { id: "mv-13-3", itemId: "item-13", lotId: "lot-13-2", type: "in", direction: "in", quantity: 35, date: "2026-08-10", reason: "stock_received" },

    // item-14 — Désinfectant instruments (lot-14-1)
    { id: "mv-14-1", itemId: "item-14", lotId: "lot-14-1", type: "in", direction: "in", quantity: 10, date: "2026-08-05", reason: "stock_received" },
    { id: "mv-14-2", itemId: "item-14", lotId: "lot-14-1", type: "out", direction: "out", quantity: 3, date: "2026-08-21", reason: "used_for_care" },

    // item-15 — Solution hydroalcoolique (no lot)
    { id: "mv-15-1", itemId: "item-15", type: "in", direction: "in", quantity: 30, date: "2026-08-02", reason: "stock_received" },

    // item-16 — Sachets de stérilisation (no lot)
    { id: "mv-16-1", itemId: "item-16", type: "in", direction: "in", quantity: 10, date: "2026-07-15", reason: "stock_received" },
    { id: "mv-16-2", itemId: "item-16", type: "out", direction: "out", quantity: 5, date: "2026-08-10", reason: "used_for_care" },
    { id: "mv-16-3", itemId: "item-16", type: "adjustment", direction: "out", quantity: 2, date: "2026-08-18", reason: "inventory_correction", note: "Comptage physique" },

    // item-17 — Masques FFP2 (no lot)
    { id: "mv-17-1", itemId: "item-17", type: "in", direction: "in", quantity: 20, date: "2026-07-10", reason: "stock_received" },
    { id: "mv-17-2", itemId: "item-17", type: "out", direction: "out", quantity: 12, date: "2026-08-19", reason: "used_for_care" },

    // item-18 — Gants stériles (lot-18-1)
    { id: "mv-18-1", itemId: "item-18", lotId: "lot-18-1", type: "in", direction: "in", quantity: 25, date: "2026-07-25", reason: "stock_received" },

    // item-19 — Lames de bistouri (no lot)
    { id: "mv-19-1", itemId: "item-19", type: "in", direction: "in", quantity: 15, date: "2026-07-28", reason: "stock_received" },
    { id: "mv-19-2", itemId: "item-19", type: "adjustment", direction: "out", quantity: 7, date: "2026-08-17", reason: "inventory_correction", note: "Comptage physique" },

    // item-20 — Spéculums jetables (no lot)
    { id: "mv-20-1", itemId: "item-20", type: "in", direction: "in", quantity: 20, date: "2026-08-03", reason: "stock_received" },

    // item-21 — Pansements post-soins (no lot) — fully consumed
    { id: "mv-21-1", itemId: "item-21", type: "in", direction: "in", quantity: 10, date: "2026-07-05", reason: "stock_received" },
    { id: "mv-21-2", itemId: "item-21", type: "out", direction: "out", quantity: 10, date: "2026-08-10", reason: "used_for_care" },

    // item-22 — Kit d'oxygène (urgence) (lot-22-1)
    { id: "mv-22-1", itemId: "item-22", lotId: "lot-22-1", type: "in", direction: "in", quantity: 4, date: "2026-06-01", reason: "stock_received" },

    // item-23 — Sacs déchets médicaux (no lot)
    { id: "mv-23-1", itemId: "item-23", type: "in", direction: "in", quantity: 15, date: "2026-07-20", reason: "stock_received" },
    { id: "mv-23-2", itemId: "item-23", type: "out", direction: "out", quantity: 5, date: "2026-08-14", reason: "internal_use", note: "Nettoyage général cabinet" },

    // item-24 — Papier ECG (inactive, no lot)
    { id: "mv-24-1", itemId: "item-24", type: "in", direction: "in", quantity: 4, date: "2026-06-01", reason: "initial_stock" },
  ];
}
