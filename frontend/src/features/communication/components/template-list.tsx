"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { COMMUNICATION_CHANNEL_MAP } from "@/components/domain/communication/channel";
import { COMMUNICATION_LOCALE_MAP } from "@/components/domain/communication/locale";
import { COMMUNICATION_PURPOSE_MAP } from "@/components/domain/communication/purpose";
import type { MessageTemplate } from "@/components/domain/communication/types";

export interface TemplateListProps {
  templates: MessageTemplate[];
  onEdit: (template: MessageTemplate) => void;
}

/** Templates list (Spec #9 Screen 41/42: Name / Channel / Locale / Active, with a [Modifier] action) — card rhythm, mirrors `ExpenseHistoryList`. */
export function TemplateList({ templates, onEdit }: TemplateListProps) {
  const { t } = useLocale();

  return (
    <ul className="flex flex-col gap-2">
      {templates.map((template) => {
        const channelMeta = COMMUNICATION_CHANNEL_MAP[template.channel];
        const localeMeta = COMMUNICATION_LOCALE_MAP[template.locale];
        const purposeMeta = COMMUNICATION_PURPOSE_MAP[template.purpose];
        const ChannelIcon = channelMeta.icon;

        return (
          <li key={template.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-text">{template.name}</p>
                <p className="text-xs text-text-muted">{t(purposeMeta.translationKey)}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-1.5">
                    <ChannelIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t(channelMeta.translationKey)}
                  </span>
                  <span>{t(localeMeta.translationKey)}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge tone={template.active ? "success" : "neutral"}>
                  {t(template.active ? "communication.templates.activeBadge" : "communication.templates.inactiveBadge")}
                </StatusBadge>
                <Button variant="outline" size="sm" onClick={() => onEdit(template)}>
                  {t("communication.templates.edit")}
                </Button>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
