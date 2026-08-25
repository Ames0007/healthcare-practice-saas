"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/i18n/locale-provider";

export interface ClinicalSummaryEntryView {
  id: string;
  label: string;
  /** Renders a restrained "Important" badge next to this one entry — never colors the whole card/section (§18-19). */
  important?: boolean;
}

export interface ClinicalSummarySectionProps {
  title: string;
  entries: ClinicalSummaryEntryView[];
  emptyText: string;
  className?: string;
}

/**
 * One "Informations importantes" card (Spec #9 Screen 18, UI-005A §17-19) —
 * restrained: a section heading, a plain entry list, an inline empty
 * sentence when there is nothing to show (never a full `EmptyState` per
 * category, §39). Reused for allergies, medical history, current
 * medications and important notes alike.
 */
export function ClinicalSummarySection({ title, entries, emptyText, className }: ClinicalSummarySectionProps) {
  const { t } = useLocale();

  return (
    <Card className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-2 text-sm text-text">
              <span>{entry.label}</span>
              {entry.important && <StatusBadge tone="danger">{t("patientDetail.health.importantLabel")}</StatusBadge>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
