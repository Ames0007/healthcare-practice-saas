"use client";

import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import type { UsageState } from "../entitlements";

export interface UsageRowProps {
  label: string;
  usage: UsageState;
}

const barToneClass = { normal: "bg-primary", atLimit: "bg-warning", overLimit: "bg-danger" } as const;

/**
 * One usage row (UI-011ABC Gate 1/2, Spec #9 Screen 47: "Praticiens 2/3",
 * "Personnel 1/5") — mirrors `SessionProgress`'s own `role="progressbar"`
 * + always-spelled-out-as-text pattern (never color-only). When
 * `usage.limit` is `undefined` ("not defined in this prototype" — e.g.
 * storage, `PlanEntitlement`'s own doc comment) no bar renders at all,
 * only the neutral placeholder text — an invented 0% bar would visually
 * assert a limit that does not exist.
 */
export function UsageRow({ label, usage }: UsageRowProps) {
  const { t } = useLocale();
  const { used, limit, atLimit, overLimit } = usage;

  if (limit === undefined) {
    return (
      <div className="flex items-center justify-between gap-3 py-2 text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="text-text-muted">{t("abonnement.usage.undefinedLimit")}</span>
      </div>
    );
  }

  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const tone = overLimit ? "overLimit" : atLimit ? "atLimit" : "normal";

  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="tabular-nums text-text-secondary" dir="ltr">
          {used} / {limit}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle"
      >
        <div className={cn("h-full rounded-full", barToneClass[tone])} style={{ width: `${percent}%` }} />
      </div>
      {overLimit && <p className="text-xs text-danger">{t("abonnement.usage.overLimitNote")}</p>}
    </div>
  );
}
