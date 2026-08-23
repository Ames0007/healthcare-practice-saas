"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { AttentionItem } from "@/components/ui/attention-item";
import type { AttentionItemData } from "@/features/today/types";

export function AttentionPanel({ items }: { items: AttentionItemData[] }) {
  const { t } = useLocale();

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
        {t("aujourdhui.attention.title")}
      </h2>
      <ul className="mt-2 divide-y divide-border">
        {items.map((item) => (
          <AttentionItem
            key={item.id}
            icon={item.icon}
            tone={item.tone}
            count={item.count}
            label={t(item.translationKey, { count: item.count })}
          />
        ))}
      </ul>
    </Card>
  );
}
