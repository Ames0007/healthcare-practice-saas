/**
 * Healthcare inventory prototype model (UI-008ABCD, Spec #4 §23,
 * Spec #2 §35-37, CLAUDE.md §30). Domain-owned, mirroring
 * `domain/finance/types.ts` and `domain/team/types.ts`.
 *
 * Balance discipline (CLAUDE.md §30/§45, Spec #4 §23.3: "Stock balance
 * should be derived/reconciled from movements"): neither `InventoryItem`
 * nor `InventoryLot` stores a current-quantity field. Every balance is
 * computed live from `StockMovement[]` (see `features/stock/stock.ts` /
 * `lots.ts`) — the same "derive, don't duplicate" discipline already
 * applied to Caisse's expected balance and Attendance's worked minutes.
 * This removes any risk of a stored balance silently drifting from its
 * own movement history.
 */

/**
 * The approved domain model (Spec #4 §23.1) has only `category_id` — no
 * separate "item type" axis. UI-008ABCD §14 asks for `category`/`itemType`
 * as two fields but itself warns "do not make every category and type
 * identical if they represent different concepts" and "avoid unnecessary
 * complexity" (§3/§14). This 10-value taxonomy already encodes handling
 * semantics (e.g. `medicines` vs `ppe` vs `diagnostic_consumables`) as
 * granularly as the task's own proposed `itemType` enum would, so a second,
 * near-1:1 parallel taxonomy was judged unnecessary duplication rather than
 * a genuinely distinct concept — `category` alone plays both roles (e.g.
 * `category === "medicines"` gates `medicineMetadata`, matching what the
 * task's own §20 would otherwise have used `itemType === "medicine"` for).
 */
export type InventoryCategory =
  | "medical_consumables"
  | "medicines"
  | "procedure_products"
  | "diagnostic_consumables"
  | "sterilization_infection_control"
  | "ppe"
  | "disposable_medical_devices"
  | "patient_aftercare"
  | "emergency_stock"
  | "operational_stock";

export type StockUnit = "unit" | "box" | "pack" | "bottle" | "vial" | "tube" | "roll" | "bag" | "kit" | "pair";

/** Informational storage note only (UI-008ABCD §21) — never temperature monitoring. */
export type StorageCondition = "ambient" | "refrigerated" | "other";

/**
 * Inventory-planning metadata (UI-008ABCD §17-19), layered on top of the
 * approved `minimum_stock` field (Spec #4 §23.1 — the only threshold the
 * approved domain model defines). `minimumStock` stays mandatory to match
 * that approved field exactly; every other threshold here is an explicit,
 * optional, non-persisted frontend enrichment (see ADR-006) that degrades
 * gracefully when absent — no item is required to configure a full supply
 * chain of thresholds it does not need. Purely planning metadata: no
 * procurement/purchase-order entity is created or implied anywhere.
 */
export interface StockPolicy {
  minimumStock: number;
  safetyStock?: number;
  reorderPoint?: number;
  maximumStock?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
}

/**
 * Inventory metadata only for `category === "medicines"` items (UI-008ABCD
 * §20) — descriptive presentation fields, never a dosage/prescribing/
 * interaction/contraindication concept of any kind.
 */
export interface MedicineMetadata {
  form?: string;
  concentration?: string;
}

export interface InventoryItem {
  id: string;
  /** Deterministic synthetic reference, `STK-####` (UI-008ABCD §13) — a single unified scheme, no per-category prefix. */
  itemNumber: string;
  name: string;
  category: InventoryCategory;
  unit: StockUnit;
  /** Informational packaging note only (UI-008ABCD §16), e.g. "100 unités / boîte" — never a unit-conversion factor. */
  packageSize?: string;
  description?: string;
  active: boolean;
  /** Spec #4 §23.1 `lot_tracking` / §35.1 "Lot tracking yes/no". */
  lotTracking: boolean;
  /**
   * Spec #4 §23.1 `expiration_tracking` / §35.1 "Expiration tracking
   * yes/no". Expiration dates live on `InventoryLot` (Spec #2 §37: "For
   * lot-tracked items: ... Expiration date"), so `expirationTracking` is
   * only meaningful — and only ever `true` in this prototype — when
   * `lotTracking` is also `true` (enforced by `isValidItemTrackingFlags`,
   * `features/stock/stock.ts`). An item with no lots has nowhere to store
   * a per-batch expiration date.
   */
  expirationTracking: boolean;
  storageCondition?: StorageCondition;
  /** Present only when `category === "medicines"`. */
  medicineMetadata?: MedicineMetadata;
  stockPolicy: StockPolicy;
}

export interface InventoryItemFormValues {
  name: string;
  category: InventoryCategory;
  unit: StockUnit;
  packageSize: string;
  description: string;
  active: boolean;
  lotTracking: boolean;
  expirationTracking: boolean;
  storageCondition: StorageCondition | "";
  medicineForm: string;
  medicineConcentration: string;
  minimumStock: string;
  safetyStock: string;
  reorderPoint: string;
  maximumStock: string;
  reorderQuantity: string;
  leadTimeDays: string;
}

/**
 * Bounded stock-attention taxonomy (UI-008ABCD §24, matching the task's
 * own Item Overview worked example exactly — see `resolveStockAttentionStatus`
 * in `features/stock/stock.ts`). "out_of_stock"/"low" always resolve from
 * the mandatory `minimumStock` alone (WF-47's own baseline); "critical"/
 * "reorder" only appear when the item configures `safetyStock`/`reorderPoint`.
 */
export type StockAttentionStatus = "out_of_stock" | "critical" | "low" | "reorder" | "available";

/**
 * Lot/batch model (Spec #4 §23.2, UI-008ABCD §8). No stored quantity field
 * — see the module-level balance-discipline note above. `expirationDate` is
 * present only for lots of an `expirationTracking` item.
 */
export interface InventoryLot {
  id: string;
  itemId: string;
  lotNumber: string;
  receivedDate: string;
  expirationDate?: string;
}

/** UI-008ABCD §37 / Spec #2 §37 — "Expiring soon" / "Expired", plus the healthy default. */
export type LotExpiryStatus = "expired" | "expiring_soon" | "valid";

/** Spec #4 §23.3 `movement_type` ENUM(in, out, adjustment). */
export type StockMovementType = "in" | "out" | "adjustment";

/** Spec #4 §23.3 `direction` ENUM(in, out) — explicit even for an adjustment, which can move balance either way. */
export type StockMovementDirection = "in" | "out";

/**
 * Bounded reason vocabulary (UI-008ABCD §13, Spec #2 §36.2 "Reason").
 * Deliberately excludes any purchasing/procurement wording (Spec #7 §24:
 * "Do not introduce purchasing/procurement vocabulary") — `stock_received`
 * describes stock arriving into the cabinet's own inventory, not a
 * supplier/purchase-order transaction.
 */
export type StockMovementReason =
  | "stock_received"
  | "returned_to_stock"
  | "initial_stock"
  | "used_for_care"
  | "expired_discarded"
  | "damaged_or_lost"
  | "internal_use"
  | "inventory_correction"
  | "other";

/**
 * Source of truth for stock changes (Spec #4 §23.3: "Source of truth for
 * stock changes"). `quantity` is always a positive magnitude; `direction`
 * carries the sign — mirrors the spec's own separate `quantity`/`direction`
 * fields exactly rather than a single signed number.
 */
export interface StockMovement {
  id: string;
  itemId: string;
  /** Present only when the item is lot-tracked. */
  lotId?: string;
  type: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  date: string;
  reason: StockMovementReason;
  note?: string;
  /** Historical/fixture-only (mirrors `CabinetExpense.createdBy`) — no "current user" concept exists in this prototype, so the interactive movement forms never populate this themselves. */
  recordedBy?: string;
}

export interface StockMovementFormValues {
  type: StockMovementType;
  direction: StockMovementDirection;
  quantity: string;
  date: string;
  reason: StockMovementReason;
  note: string;
  /** Existing lot id, or empty when creating a new lot inline (IN movements only). */
  lotId: string;
  newLotNumber: string;
  newLotExpirationDate: string;
}
