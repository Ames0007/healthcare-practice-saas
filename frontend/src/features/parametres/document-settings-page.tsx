"use client";

import { useState, type FormEvent } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import type { DocumentSettings, DocumentSettingsFormValues, PreferredLanguage } from "@/components/domain/settings/types";
import { getDocumentSettingsMockData } from "./mock-document-settings-data";
import { applyDocumentSettingsUpdate, buildInitialDocumentSettingsFormValues, validateDocumentSettingsForm } from "./document-settings";
import { ParametresNav } from "./components/parametres-nav";
import { SettingsSkeleton } from "./components/settings-skeleton";

export type DocumentSettingsPageState = "loading" | "loaded" | "error";

export interface DocumentSettingsPageProps {
  settings?: DocumentSettings;
  state?: DocumentSettingsPageState;
  onRetry?: () => void;
}

const LANGUAGE_ORDER: PreferredLanguage[] = ["fr", "ar"];

/**
 * Documents (UI-010BC Gate 2), `/app/parametres/documents` — a single-
 * record view/edit toggle bounded to what Spec #2 §47 names and this
 * prototype can honestly represent: footer/header text and document
 * language. See `DocumentSettings`'s own doc comment for what is
 * deliberately absent (templates, tax display).
 */
export function DocumentSettingsPage({ settings: providedSettings, state = "loaded", onRetry }: DocumentSettingsPageProps) {
  const { t } = useLocale();
  const [settings, setSettings] = useState<DocumentSettings>(() => providedSettings ?? getDocumentSettingsMockData());
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<DocumentSettingsFormValues>(() => buildInitialDocumentSettingsFormValues(settings));
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  function startEditing() {
    setValues(buildInitialDocumentSettingsFormValues(settings));
    setErrors({});
    setEditing(true);
  }

  function cancelEditing() {
    setErrors({});
    setEditing(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateDocumentSettingsForm(values, { required: t("parametres.documents.form.requiredError") });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    setSettings((current) => applyDocumentSettingsUpdate(current, values));
    setEditing(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("parametres.documents.pageTitle")}
        description={t("parametres.documents.pageDescription")}
        primaryAction={
          !editing ? (
            <Button size="sm" onClick={startEditing}>
              {t("parametres.documents.editAction")}
            </Button>
          ) : undefined
        }
      />

      <ParametresNav />

      <Card>
        {!editing ? (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.documents.form.footerLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{settings.footerText}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.documents.form.headerLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{settings.headerNote || t("parametres.cabinet.notSet")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-text-muted">{t("parametres.documents.form.languageLabel")}</dt>
              <dd className="mt-1 text-sm text-text">{t(`parametres.cabinet.language.${settings.documentLanguage}`)}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Input
              label={t("parametres.documents.form.footerLabel")}
              required
              value={values.footerText}
              onChange={(event) => setValues((current) => ({ ...current, footerText: event.target.value }))}
              error={errors.footerText}
            />
            <Input
              label={t("parametres.documents.form.headerLabel")}
              value={values.headerNote}
              onChange={(event) => setValues((current) => ({ ...current, headerNote: event.target.value }))}
            />
            <Select
              label={t("parametres.documents.form.languageLabel")}
              required
              value={values.documentLanguage}
              onChange={(event) => setValues((current) => ({ ...current, documentLanguage: event.target.value as PreferredLanguage }))}
              options={LANGUAGE_ORDER.map((option) => ({ value: option, label: t(`parametres.cabinet.language.${option}`) }))}
            />

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={cancelEditing}>
                {t("parametres.documents.form.cancel")}
              </Button>
              <Button type="submit">{t("parametres.documents.form.save")}</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
