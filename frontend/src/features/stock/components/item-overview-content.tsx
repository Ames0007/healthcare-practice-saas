"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/toast";
import { INVENTORY_CATEGORY_MAP } from "@/components/domain/stock/category";
import { STOCK_UNIT_MAP } from "@/components/domain/stock/unit";
import type { InventoryItem, InventoryItemFormValues } from "@/components/domain/stock/types";
import { buildInitialItemFormValues, buildItemFromFormValues } from "@/features/stock/stock";
import { ItemFormDialog } from "./item-form-dialog";

export interface ItemOverviewContentProps {
  item: InventoryItem;
  balance: number;
  onItemChange: (item: InventoryItem) => void;
}

/** The "Aperçu" tab (UI-008ABCD §26) — stock thresholds, replenishment metadata, and a bounded edit action. Purely informational: no procurement action anywhere on this screen. */
export function ItemOverviewContent({ item, balance, onItemChange }: ItemOverviewContentProps) {
  const { t } = useLocale();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const categoryMeta = INVENTORY_CATEGORY_MAP[item.category];
  const unitMeta = STOCK_UNIT_MAP[item.unit];
  const policy = item.stockPolicy;

  function openEditForm() {
    setFormOpen(true);
    setFormKey((key) => key + 1);
  }

  function handleFormSubmit(values: InventoryItemFormValues) {
    onItemChange(buildItemFromFormValues(values, item));
    setFormOpen(false);
    setToastMessage(t("stock.itemDetail.toast.updated"));
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("stock.itemDetail.overview.stockSectionTitle")}</h2>
          <Button type="button" variant="outline" size="sm" onClick={openEditForm}>
            {t("stock.itemDetail.editButton")}
          </Button>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.currentStockLabel")}</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-text" dir="ltr">
              {balance} {t(unitMeta.translationKey)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.minimumLabel")}</dt>
            <dd className="mt-1 text-sm tabular-nums text-text" dir="ltr">
              {policy.minimumStock}
            </dd>
          </div>
          {policy.safetyStock !== undefined && (
            <div>
              <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.safetyStockLabel")}</dt>
              <dd className="mt-1 text-sm tabular-nums text-text" dir="ltr">
                {policy.safetyStock}
              </dd>
            </div>
          )}
          {policy.reorderPoint !== undefined && (
            <div>
              <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.reorderPointLabel")}</dt>
              <dd className="mt-1 text-sm tabular-nums text-text" dir="ltr">
                {policy.reorderPoint}
              </dd>
            </div>
          )}
          {policy.maximumStock !== undefined && (
            <div>
              <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.maximumStockLabel")}</dt>
              <dd className="mt-1 text-sm tabular-nums text-text" dir="ltr">
                {policy.maximumStock}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {(policy.leadTimeDays !== undefined || policy.reorderQuantity !== undefined) && (
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("stock.itemDetail.overview.replenishmentSectionTitle")}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {policy.leadTimeDays !== undefined && (
              <div>
                <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.leadTimeLabel")}</dt>
                <dd className="mt-1 text-sm text-text">{t("stock.itemDetail.overview.leadTimeValue", { days: policy.leadTimeDays })}</dd>
              </div>
            )}
            {policy.reorderQuantity !== undefined && (
              <div>
                <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.reorderQuantityLabel")}</dt>
                <dd className="mt-1 text-sm tabular-nums text-text" dir="ltr">
                  {policy.reorderQuantity} {t(unitMeta.translationKey)}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <Card>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">{t("stock.itemDetail.referenceLabel")}</dt>
            <dd className="mt-1 text-sm text-text" dir="ltr">
              {item.itemNumber}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("stock.itemDetail.categoryLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{t(categoryMeta.translationKey)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">{t("stock.itemDetail.unitLabel")}</dt>
            <dd className="mt-1 text-sm text-text">{t(unitMeta.translationKey)}</dd>
          </div>
          {item.packageSize && (
            <div>
              <dt className="text-xs text-text-muted">{t("stock.itemDetail.packageSizeLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{item.packageSize}</dd>
            </div>
          )}
          {item.storageCondition && (
            <div>
              <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.storageConditionLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{t(`stock.storageCondition.${item.storageCondition}`)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 border-t border-border pt-4">
          <dt className="text-xs text-text-muted">{t("stock.itemDetail.descriptionLabel")}</dt>
          <dd className="mt-1 text-sm text-text">{item.description || t("stock.itemDetail.overview.noDescription")}</dd>
        </div>
      </Card>

      {item.medicineMetadata && (item.medicineMetadata.form || item.medicineMetadata.concentration) && (
        <Card>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t("stock.itemDetail.overview.medicineSectionTitle")}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {item.medicineMetadata.form && (
              <div>
                <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.medicineFormLabel")}</dt>
                <dd className="mt-1 text-sm text-text">{item.medicineMetadata.form}</dd>
              </div>
            )}
            {item.medicineMetadata.concentration && (
              <div>
                <dt className="text-xs text-text-muted">{t("stock.itemDetail.overview.medicineConcentrationLabel")}</dt>
                <dd className="mt-1 text-sm text-text" dir="ltr">
                  {item.medicineMetadata.concentration}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      <ItemFormDialog
        key={formKey}
        open={formOpen}
        itemNumber={item.itemNumber}
        initialValues={buildInitialItemFormValues(item)}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
