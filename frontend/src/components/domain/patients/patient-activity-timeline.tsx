"use client";

import { CalendarCheck, FileText, Stethoscope, Activity, Wallet, type LucideIcon } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import type { PatientActivityItem, PatientActivityType } from "./types";

const TYPE_ICON: Record<PatientActivityType, LucideIcon> = {
  appointment: CalendarCheck,
  consultation: Stethoscope,
  payment: Wallet,
  document: FileText,
  treatment: Activity,
};

export interface PatientActivityTimelineProps {
  items: PatientActivityItem[];
  /** Pre-formatted per item, e.g. "23 août" (Patient 360°'s date style) — computed by the caller, not this component. */
  dateLabels: Record<string, string>;
  /** Pre-formatted (e.g. "500 MAD") for items whose `amount` is set — money formatting stays in the feature layer, not the domain layer. */
  amountLabels: Record<string, string>;
  emptyLabel: string;
}

/**
 * Unified patient operational timeline (Spec #9 Screen 17, UI-004A §29-31).
 * Concise event summaries only — title + optional short detail (e.g. a
 * money amount), never clinical note/diagnosis text (UI-004A §32). Takes
 * only the shared `overview-types.ts` shape plus pre-resolved display
 * strings — no dependency on `features/*` formatting/mock-data, keeping
 * the domain layer independent of feature code (see `appointment-card.tsx`
 * for the same convention).
 */
export function PatientActivityTimeline({ items, dateLabels, amountLabels, emptyLabel }: PatientActivityTimelineProps) {
  const { t } = useLocale();

  if (items.length === 0) {
    return <p className="text-sm text-text-muted">{emptyLabel}</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {items.map((item) => {
        const Icon = TYPE_ICON[item.type];
        const amountLabel = amountLabels[item.id];
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-text-secondary">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted" dir="ltr">
                {dateLabels[item.id]}
              </p>
              <p className="text-sm font-medium text-text">
                {t(item.translationKey)}
                {amountLabel && (
                  <span className="font-normal text-text-secondary">
                    {" "}
                    · <span dir="ltr">{amountLabel}</span>
                  </span>
                )}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
