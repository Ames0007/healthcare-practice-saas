"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { CabinetService, CabinetServiceFormValues } from "@/components/domain/settings/types";
import { buildInitialServiceFormValues, buildServiceFromFormValues, sortServicesByName } from "@/features/parametres/services";
import { ServiceTable } from "@/features/parametres/components/service-table";
import { ServiceFormDialog } from "@/features/parametres/components/service-form-dialog";

export interface OnboardingServicesStepProps {
  services: CabinetService[];
  onChange: (services: CabinetService[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Step 3 — Services (task §18/§19, Spec #9 Screen 06). Reuses
 * `ServiceTable`/`ServiceFormDialog` outright — the exact same components
 * and `parametres.services.*` translation keys Paramètres → Services &
 * tarifs itself uses (task §31, proven by
 * `cross-onboarding-integrity.test.ts`), never a second service form. No
 * minimum-one-active-service requirement exists anywhere in the approved
 * specifications (grep-confirmed) — task §19's own "do not invent the
 * requirement silently" is honored by leaving Continue always enabled,
 * even with zero services.
 */
export function OnboardingServicesStep({ services, onChange, onContinue, onBack }: OnboardingServicesStepProps) {
  const { t } = useLocale();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CabinetService | null>(null);

  const rows = sortServicesByName(services);

  function handleAddSubmit(values: CabinetServiceFormValues) {
    const created = buildServiceFromFormValues(values, undefined, services);
    onChange([...services, created]);
    setIsAddDialogOpen(false);
  }

  function handleEditSubmit(values: CabinetServiceFormValues) {
    const updated = buildServiceFromFormValues(values, editingService!, services);
    onChange(services.map((service) => (service.id === updated.id ? updated : service)));
    setEditingService(null);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text">{t("onboarding.services.heading")}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t("onboarding.services.description")}</p>
        </div>
        <Button size="sm" type="button" onClick={() => setIsAddDialogOpen(true)}>
          {t("parametres.services.addButton")}
        </Button>
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState title={t("onboarding.services.emptyTitle")} description={t("onboarding.services.emptyDescription")} />
        ) : (
          <ServiceTable services={rows} onEdit={setEditingService} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 mt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("onboarding.nav.back")}
        </Button>
        <Button type="button" onClick={onContinue}>
          {t("onboarding.nav.continue")}
        </Button>
      </div>

      <ServiceFormDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddSubmit}
        initialValues={buildInitialServiceFormValues()}
      />

      {editingService && (
        <ServiceFormDialog
          key={editingService.id}
          open
          isEdit
          onClose={() => setEditingService(null)}
          onSubmit={handleEditSubmit}
          initialValues={buildInitialServiceFormValues(editingService)}
        />
      )}
    </Card>
  );
}
