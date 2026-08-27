"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { MessageTemplate, MessageTemplateFormValues } from "@/components/domain/communication/types";
import { getMessageTemplatesMockData } from "./mock-templates-data";
import { buildInitialTemplateFormValues, buildTemplateFromFormValues, generateNextTemplateId, sortTemplatesByName } from "./templates";
import { CommunicationNav } from "./components/communication-nav";
import { TemplateList } from "./components/template-list";
import { TemplateFormDialog } from "./components/template-form-dialog";

export type TemplatesPageState = "loading" | "loaded" | "error";

export interface TemplatesPageProps {
  templates?: MessageTemplate[];
  state?: TemplatesPageState;
  onRetry?: () => void;
}

/**
 * Templates workspace (UI-009ABC Gate 2, `/app/communication/templates`,
 * Spec #9 Screen 41/42). Add creates a new template; editing an existing
 * one opens the same bounded dialog pre-filled — local page state only,
 * no persistence (mirrors every other prototype Add/Edit flow).
 */
export function TemplatesPage({ templates: providedTemplates, state = "loaded", onRetry }: TemplatesPageProps) {
  const { t } = useLocale();
  const [overrideTemplates, setOverrideTemplates] = useState<MessageTemplate[] | null>(null);
  const [dialogTemplate, setDialogTemplate] = useState<MessageTemplate | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("communication.templates.pageTitle")} description={t("communication.templates.pageDescription")} />
        <CommunicationNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("communication.templates.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("communication.templates.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const seedTemplates = providedTemplates ?? getMessageTemplatesMockData();
  const templates = overrideTemplates ?? seedTemplates;

  function handleAddSubmit(values: MessageTemplateFormValues) {
    const created = buildTemplateFromFormValues(values, undefined, generateNextTemplateId(templates));
    setOverrideTemplates([...templates, created]);
    setIsAddDialogOpen(false);
  }

  function handleEditSubmit(values: MessageTemplateFormValues) {
    if (!dialogTemplate) {
      return;
    }
    const updated = buildTemplateFromFormValues(values, dialogTemplate, dialogTemplate.id);
    setOverrideTemplates(templates.map((template) => (template.id === dialogTemplate.id ? updated : template)));
    setDialogTemplate(null);
  }

  const addButton = (
    <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
      {t("communication.templates.addButton")}
    </Button>
  );

  const rows = sortTemplatesByName(templates);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("communication.templates.pageTitle")} description={t("communication.templates.pageDescription")} primaryAction={addButton} />

      <CommunicationNav />

      {rows.length === 0 ? (
        <EmptyState title={t("communication.templates.emptyTitle")} description={t("communication.templates.emptyDescription")} primaryAction={addButton} />
      ) : (
        <TemplateList templates={rows} onEdit={setDialogTemplate} />
      )}

      <TemplateFormDialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)} onSubmit={handleAddSubmit} initialValues={buildInitialTemplateFormValues()} />

      {dialogTemplate && (
        // Keyed by id so switching the edit target between rows remounts the dialog with fresh `useState`
        // initial values — otherwise React would keep the previously-selected template's form state.
        <TemplateFormDialog
          key={dialogTemplate.id}
          open
          onClose={() => setDialogTemplate(null)}
          onSubmit={handleEditSubmit}
          initialValues={buildInitialTemplateFormValues(dialogTemplate)}
          isEdit
        />
      )}
    </div>
  );
}
