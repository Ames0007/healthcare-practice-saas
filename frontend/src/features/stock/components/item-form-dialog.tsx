"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INVENTORY_CATEGORY_MAP, INVENTORY_CATEGORY_ORDER } from "@/components/domain/stock/category";
import { STOCK_UNIT_MAP, STOCK_UNIT_ORDER } from "@/components/domain/stock/unit";
import type { InventoryCategory, InventoryItemFormValues, StockUnit, StorageCondition } from "@/components/domain/stock/types";
import { isValidItemTrackingFlags, isValidStockPolicy } from "@/features/stock/stock";

export interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: InventoryItemFormValues) => void;
  initialValues: InventoryItemFormValues;
  /** Read-only display context, omitted when adding a new article. */
  itemNumber?: string;
}

const STORAGE_CONDITION_ORDER: StorageCondition[] = ["ambient", "refrigerated", "other"];

/**
 * Bounded add/edit article prototype (UI-008ABCD §12/§22, one dialog for
 * both flows — mirrors `ContractFormDialog`'s drawer/validate/submit
 * shape). `expirationTracking` is force-cleared whenever `lotTracking` is
 * turned off (`isValidItemTrackingFlags`) since an item with no lots has
 * nowhere to store a per-batch expiration date.
 */
export function ItemFormDialog({ open, onClose, onSubmit, initialValues, itemNumber }: ItemFormDialogProps) {
  const { t } = useLocale();

  const [name, setName] = useState(initialValues.name);
  const [category, setCategory] = useState<InventoryCategory>(initialValues.category);
  const [unit, setUnit] = useState<StockUnit>(initialValues.unit);
  const [packageSize, setPackageSize] = useState(initialValues.packageSize);
  const [description, setDescription] = useState(initialValues.description);
  const [active, setActive] = useState(initialValues.active);
  const [lotTracking, setLotTracking] = useState(initialValues.lotTracking);
  const [expirationTracking, setExpirationTracking] = useState(initialValues.expirationTracking);
  const [storageCondition, setStorageCondition] = useState<StorageCondition | "">(initialValues.storageCondition);
  const [medicineForm, setMedicineForm] = useState(initialValues.medicineForm);
  const [medicineConcentration, setMedicineConcentration] = useState(initialValues.medicineConcentration);
  const [minimumStock, setMinimumStock] = useState(initialValues.minimumStock);
  const [safetyStock, setSafetyStock] = useState(initialValues.safetyStock);
  const [reorderPoint, setReorderPoint] = useState(initialValues.reorderPoint);
  const [maximumStock, setMaximumStock] = useState(initialValues.maximumStock);
  const [reorderQuantity, setReorderQuantity] = useState(initialValues.reorderQuantity);
  const [leadTimeDays, setLeadTimeDays] = useState(initialValues.leadTimeDays);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleLotTrackingChange(next: boolean) {
    setLotTracking(next);
    if (!next) setExpirationTracking(false);
  }

  function buildValues(): InventoryItemFormValues {
    return {
      name: name.trim(),
      category,
      unit,
      packageSize: packageSize.trim(),
      description: description.trim(),
      active,
      lotTracking,
      expirationTracking,
      storageCondition,
      medicineForm: medicineForm.trim(),
      medicineConcentration: medicineConcentration.trim(),
      minimumStock: minimumStock.trim(),
      safetyStock: safetyStock.trim(),
      reorderPoint: reorderPoint.trim(),
      maximumStock: maximumStock.trim(),
      reorderQuantity: reorderQuantity.trim(),
      leadTimeDays: leadTimeDays.trim(),
    };
  }

  function validate(values: InventoryItemFormValues): Record<string, string> {
    const required = t("stock.itemDetail.form.requiredError");
    const negative = t("stock.itemDetail.form.negativeValueError");
    const nextErrors: Record<string, string> = {};

    if (!values.name) nextErrors.name = required;
    if (values.minimumStock === "") {
      nextErrors.minimumStock = required;
    } else if (Number(values.minimumStock) < 0) {
      nextErrors.minimumStock = negative;
    }

    const optionalNumericFields: (keyof InventoryItemFormValues)[] = ["safetyStock", "reorderPoint", "maximumStock", "reorderQuantity", "leadTimeDays"];
    for (const field of optionalNumericFields) {
      const raw = values[field];
      if (raw !== "" && Number(raw) < 0) {
        nextErrors[field] = negative;
      }
    }

    if (
      values.minimumStock !== "" &&
      values.maximumStock !== "" &&
      !nextErrors.minimumStock &&
      !nextErrors.maximumStock &&
      !isValidStockPolicy({ minimumStock: Number(values.minimumStock), maximumStock: Number(values.maximumStock) })
    ) {
      nextErrors.maximumStock = t("stock.itemDetail.form.maximumBelowMinimumError");
    }

    if (!isValidItemTrackingFlags(values.lotTracking, values.expirationTracking)) {
      nextErrors.expirationTracking = t("stock.itemDetail.form.expirationRequiresLotError");
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const values = buildValues();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit(values);
  }

  const isEdit = itemNumber !== undefined;
  const title = t(isEdit ? "stock.itemDetail.form.editTitle" : "stock.itemDetail.form.addTitle");

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={title} closeLabel={t("stock.itemDetail.form.close")}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          {itemNumber && (
            <p className="mt-1 text-sm text-text-muted" dir="ltr">
              {itemNumber}
            </p>
          )}
        </div>

        <section className="flex flex-col gap-4">
          <Input label={t("stock.itemDetail.form.nameLabel")} required value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
          <Select
            label={t("stock.itemDetail.form.categoryLabel")}
            required
            value={category}
            onChange={(event) => setCategory(event.target.value as InventoryCategory)}
            options={INVENTORY_CATEGORY_ORDER.map((option) => ({ value: option, label: t(INVENTORY_CATEGORY_MAP[option].translationKey) }))}
          />
          <Select
            label={t("stock.itemDetail.form.unitLabel")}
            required
            value={unit}
            onChange={(event) => setUnit(event.target.value as StockUnit)}
            options={STOCK_UNIT_ORDER.map((option) => ({ value: option, label: t(STOCK_UNIT_MAP[option].translationKey) }))}
          />
          <Input
            label={t("stock.itemDetail.form.packageSizeLabel")}
            helperText={t("stock.itemDetail.form.packageSizeHelp")}
            value={packageSize}
            onChange={(event) => setPackageSize(event.target.value)}
          />
          <Textarea label={t("stock.itemDetail.form.descriptionLabel")} value={description} onChange={(event) => setDescription(event.target.value)} />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 rounded border-border-strong" />
            {t("stock.itemDetail.form.activeLabel")}
          </label>
        </section>

        <section className="flex flex-col gap-4 border-t border-border pt-4">
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={lotTracking}
              onChange={(event) => handleLotTrackingChange(event.target.checked)}
              className="h-4 w-4 rounded border-border-strong"
            />
            {t("stock.itemDetail.form.lotTrackingLabel")}
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={expirationTracking}
              disabled={!lotTracking}
              onChange={(event) => setExpirationTracking(event.target.checked)}
              className="h-4 w-4 rounded border-border-strong disabled:cursor-not-allowed"
            />
            {t("stock.itemDetail.form.expirationTrackingLabel")}
          </label>
          {!lotTracking && <p className="text-sm text-text-muted">{t("stock.itemDetail.form.expirationTrackingHelp")}</p>}
          {errors.expirationTracking && <p className="text-sm text-danger">{errors.expirationTracking}</p>}
          <Select
            label={t("stock.itemDetail.form.storageConditionLabel")}
            value={storageCondition}
            onChange={(event) => setStorageCondition(event.target.value as StorageCondition | "")}
            placeholder={t("stock.itemDetail.form.storageConditionPlaceholder")}
            options={STORAGE_CONDITION_ORDER.map((option) => ({ value: option, label: t(`stock.storageCondition.${option}`) }))}
          />
        </section>

        {category === "medicines" && (
          <section className="flex flex-col gap-4 border-t border-border pt-4">
            <Input label={t("stock.itemDetail.form.medicineFormLabel")} value={medicineForm} onChange={(event) => setMedicineForm(event.target.value)} />
            <Input
              label={t("stock.itemDetail.form.medicineConcentrationLabel")}
              value={medicineConcentration}
              onChange={(event) => setMedicineConcentration(event.target.value)}
            />
          </section>
        )}

        <section className="flex flex-col gap-4 border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-text">{t("stock.itemDetail.form.policySectionTitle")}</h3>
          <Input
            type="number"
            min="0"
            label={t("stock.itemDetail.form.minimumStockLabel")}
            required
            value={minimumStock}
            onChange={(event) => setMinimumStock(event.target.value)}
            error={errors.minimumStock}
          />
          <Input
            type="number"
            min="0"
            label={t("stock.itemDetail.form.safetyStockLabel")}
            value={safetyStock}
            onChange={(event) => setSafetyStock(event.target.value)}
            error={errors.safetyStock}
          />
          <Input
            type="number"
            min="0"
            label={t("stock.itemDetail.form.reorderPointLabel")}
            value={reorderPoint}
            onChange={(event) => setReorderPoint(event.target.value)}
            error={errors.reorderPoint}
          />
          <Input
            type="number"
            min="0"
            label={t("stock.itemDetail.form.maximumStockLabel")}
            value={maximumStock}
            onChange={(event) => setMaximumStock(event.target.value)}
            error={errors.maximumStock}
          />
          <Input
            type="number"
            min="0"
            label={t("stock.itemDetail.form.reorderQuantityLabel")}
            value={reorderQuantity}
            onChange={(event) => setReorderQuantity(event.target.value)}
            error={errors.reorderQuantity}
          />
          <Input
            type="number"
            min="0"
            label={t("stock.itemDetail.form.leadTimeDaysLabel")}
            value={leadTimeDays}
            onChange={(event) => setLeadTimeDays(event.target.value)}
            error={errors.leadTimeDays}
          />
        </section>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("stock.itemDetail.form.cancel")}
          </Button>
          <Button type="submit">{t(isEdit ? "stock.itemDetail.form.submitEdit" : "stock.itemDetail.form.submitAdd")}</Button>
        </div>
      </form>
    </Dialog>
  );
}
