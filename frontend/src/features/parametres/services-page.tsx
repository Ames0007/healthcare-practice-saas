"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { CabinetService, CabinetServiceFormValues } from "@/components/domain/settings/types";
import { getCabinetServicesMockData } from "./mock-cabinet-services-data";
import { buildInitialServiceFormValues, buildServiceFromFormValues, sortServicesByName } from "./services";
import { ParametresNav } from "./components/parametres-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";
import { ServiceTable } from "./components/service-table";
import { ServiceFormDialog } from "./components/service-form-dialog";

export type ServicesPageState = "loading" | "loaded" | "error";

export interface ServicesPageProps {
  services?: CabinetService[];
  state?: ServicesPageState;
  onRetry?: () => void;
}

/**
 * Services & Pricing (UI-010ABC Gate 3), `/app/parametres/services`. Names
 * trace back to Agenda's own pre-existing `SERVICES` catalog (task §5).
 * Add/Edit reuse one `ServiceFormDialog` — the Edit instance is
 * conditionally rendered with `key={editingService.id}` so switching edit
 * targets always remounts with fresh initial values (UI-009ABC's own
 * documented stale-`useState` bug fix, reapplied here preemptively).
 */
export function ServicesPage({ services: providedServices, state = "loaded", onRetry }: ServicesPageProps) {
  const { t } = useLocale();
  const [overrideServices, setOverrideServices] = useState<CabinetService[] | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<CabinetService | null>(null);

  if (state === "loading") {
    return <SettingsSkeleton />;
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("parametres.error.title")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("parametres.error.retry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const seedServices = providedServices ?? getCabinetServicesMockData();
  const services = overrideServices ?? seedServices;
  const rows = sortServicesByName(services);

  function handleAddSubmit(values: CabinetServiceFormValues) {
    const created = buildServiceFromFormValues(values, undefined, services);
    setOverrideServices([...services, created]);
    setIsAddDialogOpen(false);
  }

  function handleEditSubmit(values: CabinetServiceFormValues) {
    const updated = buildServiceFromFormValues(values, editingService!, services);
    setOverrideServices(services.map((service) => (service.id === updated.id ? updated : service)));
    setEditingService(null);
  }

  const addButton = (
    <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
      {t("parametres.services.addButton")}
    </Button>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("parametres.services.pageTitle")} description={t("parametres.services.pageDescription")} primaryAction={addButton} />

      <ParametresNav />

      {rows.length === 0 ? (
        <EmptyState title={t("parametres.services.emptyTitle")} description={t("parametres.services.emptyDescription")} />
      ) : (
        <ServiceTable services={rows} onEdit={setEditingService} />
      )}

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
    </div>
  );
}
