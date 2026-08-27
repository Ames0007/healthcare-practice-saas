import type { InventoryItem, InventoryItemFormValues, StockAttentionStatus, StockMovement, StockPolicy } from "@/components/domain/stock/types";

/**
 * Item balance — always derived live from movements (Spec #4 §23.3, see
 * the balance-discipline note in `components/domain/stock/types.ts`),
 * never a stored field. Sums every movement for the item regardless of
 * lot (a lot-tracked item's movements always carry a `lotId`, so this
 * equals the sum of that item's own lot balances — proven by
 * `cross-inventory-integrity.test.ts`).
 */
export function computeItemStockBalance(movements: StockMovement[], itemId: string): number {
  return movements
    .filter((movement) => movement.itemId === itemId)
    .reduce((total, movement) => total + (movement.direction === "in" ? movement.quantity : -movement.quantity), 0);
}

/**
 * Bounded stock-attention resolution (UI-008ABCD §24), worst to best:
 * out_of_stock -> critical -> low -> reorder -> available. Reproduces the
 * task's own worked example exactly (`item-02`, balance 18, minimum 25,
 * safety 15, reorder 30 -> "low", not "critical" or "reorder" — see
 * `stock.test.ts`). `critical`/`reorder` only exist when the item
 * configures `safetyStock`/`reorderPoint`; every item can still resolve
 * `low`/`out_of_stock` from the mandatory `minimumStock` alone (WF-47).
 */
export function resolveStockAttentionStatus(balance: number, policy: StockPolicy): StockAttentionStatus {
  if (balance <= 0) return "out_of_stock";
  if (policy.safetyStock !== undefined && balance <= policy.safetyStock) return "critical";
  if (balance <= policy.minimumStock) return "low";
  if (policy.reorderPoint !== undefined && balance <= policy.reorderPoint) return "reorder";
  return "available";
}

/** UI-008ABCD §19: quantities cannot be negative, and a configured maximum cannot sit below the minimum. Thresholds otherwise stay unordered by design — e.g. a reorder point may legitimately be configured below, at, or above safety stock depending on the item. */
export function isValidStockPolicy(policy: StockPolicy): boolean {
  const values = [policy.minimumStock, policy.safetyStock, policy.reorderPoint, policy.maximumStock, policy.reorderQuantity, policy.leadTimeDays];
  if (values.some((value) => value !== undefined && value < 0)) return false;
  if (policy.maximumStock !== undefined && policy.maximumStock < policy.minimumStock) return false;
  return true;
}

/** `expirationTracking` only has somewhere to store a date when the item is also `lotTracking` (see `InventoryItem.expirationTracking`'s own doc comment). */
export function isValidItemTrackingFlags(lotTracking: boolean, expirationTracking: boolean): boolean {
  return lotTracking || !expirationTracking;
}

export function matchesItemSearch(item: InventoryItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return item.name.toLowerCase().includes(query) || item.itemNumber.toLowerCase().includes(query);
}

export function matchesItemCategoryFilter(item: InventoryItem, filter: InventoryItem["category"] | "all"): boolean {
  return filter === "all" || item.category === filter;
}

export function matchesItemAttentionFilter(status: StockAttentionStatus, filter: StockAttentionStatus | "all"): boolean {
  return filter === "all" || status === filter;
}

export function sortItemsByName(items: InventoryItem[]): InventoryItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** `STK-####`, one unified scheme (UI-008ABCD §13) — never a per-category prefix. */
export function generateNextItemNumber(items: InventoryItem[]): string {
  const maxSequence = items.reduce((max, item) => {
    const match = /^STK-(\d{4})$/.exec(item.itemNumber);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `STK-${String(maxSequence + 1).padStart(4, "0")}`;
}

export function buildInitialItemFormValues(item?: InventoryItem): InventoryItemFormValues {
  return {
    name: item?.name ?? "",
    category: item?.category ?? "medical_consumables",
    unit: item?.unit ?? "unit",
    packageSize: item?.packageSize ?? "",
    description: item?.description ?? "",
    active: item?.active ?? true,
    lotTracking: item?.lotTracking ?? false,
    expirationTracking: item?.expirationTracking ?? false,
    storageCondition: item?.storageCondition ?? "",
    medicineForm: item?.medicineMetadata?.form ?? "",
    medicineConcentration: item?.medicineMetadata?.concentration ?? "",
    minimumStock: item ? String(item.stockPolicy.minimumStock) : "",
    safetyStock: item?.stockPolicy.safetyStock !== undefined ? String(item.stockPolicy.safetyStock) : "",
    reorderPoint: item?.stockPolicy.reorderPoint !== undefined ? String(item.stockPolicy.reorderPoint) : "",
    maximumStock: item?.stockPolicy.maximumStock !== undefined ? String(item.stockPolicy.maximumStock) : "",
    reorderQuantity: item?.stockPolicy.reorderQuantity !== undefined ? String(item.stockPolicy.reorderQuantity) : "",
    leadTimeDays: item?.stockPolicy.leadTimeDays !== undefined ? String(item.stockPolicy.leadTimeDays) : "",
  };
}

function parseOptionalNonNegativeNumber(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

/** Builds a full `InventoryItem` from validated form values — the caller (`isValidStockPolicy`/`isValidItemTrackingFlags`/required-field checks) must already have validated `values` before calling this. */
export function buildItemFromFormValues(values: InventoryItemFormValues, existing?: InventoryItem, generatedItemNumber?: string): InventoryItem {
  const stockPolicy: StockPolicy = {
    minimumStock: Number(values.minimumStock),
    safetyStock: parseOptionalNonNegativeNumber(values.safetyStock),
    reorderPoint: parseOptionalNonNegativeNumber(values.reorderPoint),
    maximumStock: parseOptionalNonNegativeNumber(values.maximumStock),
    reorderQuantity: parseOptionalNonNegativeNumber(values.reorderQuantity),
    leadTimeDays: parseOptionalNonNegativeNumber(values.leadTimeDays),
  };

  return {
    id: existing?.id ?? `item-${Date.now()}`,
    itemNumber: existing?.itemNumber ?? generatedItemNumber ?? "STK-0000",
    name: values.name.trim(),
    category: values.category,
    unit: values.unit,
    packageSize: values.packageSize.trim() || undefined,
    description: values.description.trim() || undefined,
    active: values.active,
    lotTracking: values.lotTracking,
    expirationTracking: values.expirationTracking,
    storageCondition: values.storageCondition || undefined,
    medicineMetadata:
      values.category === "medicines" && (values.medicineForm.trim() || values.medicineConcentration.trim())
        ? { form: values.medicineForm.trim() || undefined, concentration: values.medicineConcentration.trim() || undefined }
        : undefined,
    stockPolicy,
  };
}
