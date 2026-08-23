"use client";

import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { FoundationBadge } from "@/components/app/foundation-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * Foundation/demo shell page (TASK-003 §23). Not a real Aujourd'hui
 * dashboard — validates the component/token/i18n/RTL foundation only.
 */
export default function FoundationDemoPage() {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        <FoundationBadge />
      </div>

      <PageHeader title={t("foundation.title")} description={t("foundation.description")} />

      <Section title={t("foundation.buttonsTitle")}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">{t("foundation.buttons.primary")}</Button>
          <Button variant="secondary">{t("foundation.buttons.secondary")}</Button>
          <Button variant="outline">{t("foundation.buttons.outline")}</Button>
          <Button variant="ghost">{t("foundation.buttons.ghost")}</Button>
          <Button variant="danger">{t("foundation.buttons.danger")}</Button>
          <Button variant="primary" loading>
            {t("foundation.buttons.loading")}
          </Button>
          <Button variant="primary" disabled>
            {t("foundation.buttons.disabled")}
          </Button>
        </div>
      </Section>

      <Section title={t("foundation.inputTitle")}>
        <div className="grid max-w-md gap-4">
          <Input
            label={t("foundation.input.label")}
            placeholder={t("foundation.input.placeholder")}
            helperText={t("foundation.input.helper")}
          />
          <Input label={t("foundation.input.errorLabel")} error={t("foundation.input.error")} required />
        </div>
      </Section>

      <Section title={t("foundation.cardTitle")}>
        <Card className="max-w-sm">
          <p className="font-medium text-text">{t("foundation.card.title")}</p>
          <p className="mt-1 text-sm text-text-muted">{t("foundation.card.description")}</p>
        </Card>
      </Section>

      <Section title={t("foundation.statusTitle")}>
        <div className="flex flex-wrap gap-3">
          <StatusBadge tone="info">{t("foundation.status.confirmed")}</StatusBadge>
          <StatusBadge tone="warning">{t("foundation.status.toConfirm")}</StatusBadge>
          <StatusBadge tone="primary">{t("foundation.status.inConsultation")}</StatusBadge>
          <StatusBadge tone="success">{t("foundation.status.completed")}</StatusBadge>
          <StatusBadge tone="danger">{t("foundation.status.overdue")}</StatusBadge>
        </div>
      </Section>

      <Section title={t("foundation.skeletonTitle")}>
        <div className="flex max-w-sm flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Section>

      <Section title={t("foundation.emptyStateTitle")}>
        <EmptyState
          title={t("foundation.emptyState.title")}
          description={t("foundation.emptyState.description")}
          primaryAction={<Button size="sm">{t("foundation.emptyState.primaryAction")}</Button>}
          secondaryAction={
            <Button size="sm" variant="outline">
              {t("foundation.emptyState.secondaryAction")}
            </Button>
          }
        />
      </Section>
    </div>
  );
}
