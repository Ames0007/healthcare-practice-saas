"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { COMMUNICATION_CHANNEL_MAP } from "@/components/domain/communication/channel";
import { COMMUNICATION_EVENT_TYPE_MAP } from "@/components/domain/communication/event-type";
import type { AutomationRule, MessageTemplate } from "@/components/domain/communication/types";
import { resolveRuleTemplate } from "@/features/communication/automations";

export interface AutomationRuleListProps {
  rules: AutomationRule[];
  templates: MessageTemplate[];
  onToggleActive: (ruleId: string) => void;
}

function formatTimingOffset(minutes: number | undefined, t: (key: string, params?: Record<string, string | number>) => string): string | null {
  if (minutes === undefined) {
    return null;
  }
  if (minutes % 1440 === 0) {
    return t("communication.automations.timingDays", { count: minutes / 1440 });
  }
  if (minutes % 60 === 0) {
    return t("communication.automations.timingHours", { count: minutes / 60 });
  }
  return t("communication.automations.timingMinutes", { count: minutes });
}

/**
 * Fixed canonical automation-rule list (UI-009ABC §11, Spec #2 §40's own
 * closing line: "Owner can configure whether each automation is
 * active."). The only editable field is the active toggle — channel and
 * template stay read-only, so this stays a bounded configuration
 * prototype rather than a rule builder (CLAUDE.md §3).
 */
export function AutomationRuleList({ rules, templates, onToggleActive }: AutomationRuleListProps) {
  const { t } = useLocale();

  return (
    <ul className="flex flex-col gap-2">
      {rules.map((rule) => {
        const eventMeta = COMMUNICATION_EVENT_TYPE_MAP[rule.eventType];
        const channelMeta = COMMUNICATION_CHANNEL_MAP[rule.channel];
        const template = resolveRuleTemplate(rule, templates);
        const ChannelIcon = channelMeta.icon;
        const timingLabel = formatTimingOffset(rule.timingOffsetMinutes, t);

        return (
          <li key={rule.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{t(eventMeta.translationKey)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t(channelMeta.translationKey)}
                  </span>
                  <span>{template ? template.name : t("communication.automations.noTemplate")}</span>
                  {timingLabel && <span className="text-text-muted">{timingLabel}</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge tone={rule.active ? "success" : "neutral"}>
                  {t(rule.active ? "communication.automations.activeBadge" : "communication.automations.inactiveBadge")}
                </StatusBadge>
                <button
                  type="button"
                  role="switch"
                  aria-checked={rule.active}
                  aria-label={t("communication.automations.toggleLabel", { name: t(eventMeta.translationKey) })}
                  onClick={() => onToggleActive(rule.id)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${rule.active ? "bg-primary" : "bg-surface-subtle"}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-ds-sm transition-transform ${rule.active ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
