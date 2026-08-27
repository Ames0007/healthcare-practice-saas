"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { AutomationRule, MessageTemplate } from "@/components/domain/communication/types";
import { getAutomationRulesMockData } from "./mock-automation-rules-data";
import { getMessageTemplatesMockData } from "./mock-templates-data";
import { sortRulesByEventType, toggleRuleActive } from "./automations";
import { CommunicationNav } from "./components/communication-nav";
import { AutomationRuleList } from "./components/automation-rule-list";

export type AutomationsPageState = "loading" | "loaded" | "error";

export interface AutomationsPageProps {
  rules?: AutomationRule[];
  templates?: MessageTemplate[];
  state?: AutomationsPageState;
  onRetry?: () => void;
}

/**
 * Automations workspace (UI-009ABC Gate 2, `/app/communication/automations`,
 * Spec #2 §40) — the fixed canonical set of automation triggers, each
 * toggleable active/inactive. Local page state only, no persistence.
 */
export function AutomationsPage({ rules: providedRules, templates: providedTemplates, state = "loaded", onRetry }: AutomationsPageProps) {
  const { t } = useLocale();
  const [overrideRules, setOverrideRules] = useState<AutomationRule[] | null>(null);

  if (state === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={t("communication.automations.pageTitle")} description={t("communication.automations.pageDescription")} />
        <CommunicationNav />
        <div className="animate-pulse rounded-lg border border-border bg-surface-subtle" style={{ height: 320 }} />
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("communication.automations.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("communication.automations.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const seedRules = providedRules ?? getAutomationRulesMockData();
  const rules = overrideRules ?? seedRules;
  const templates = providedTemplates ?? getMessageTemplatesMockData();

  function handleToggleActive(ruleId: string) {
    setOverrideRules(toggleRuleActive(rules, ruleId));
  }

  const rows = sortRulesByEventType(rules);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("communication.automations.pageTitle")} description={t("communication.automations.pageDescription")} />

      <CommunicationNav />

      {rows.length === 0 ? (
        <EmptyState title={t("communication.automations.emptyTitle")} />
      ) : (
        <AutomationRuleList rules={rows} templates={templates} onToggleActive={handleToggleActive} />
      )}
    </div>
  );
}
