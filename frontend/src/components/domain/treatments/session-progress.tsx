"use client";

import { useLocale } from "@/i18n/locale-provider";

export interface SessionProgressProps {
  completed: number;
  scheduled: number;
  total: number;
}

/**
 * Reusable session-progress summary (Spec #8 §97 `SessionProgress`, UI-004C
 * §15-16): completed/scheduled/remaining counts plus a restrained single-
 * tone bar — never communicating progress through color alone, since the
 * three counts are always spelled out as text. Pure presentation, only
 * takes numbers, no mock-data coupling.
 */
export function SessionProgress({ completed, scheduled, total }: SessionProgressProps) {
  const { t } = useLocale();
  const remaining = Math.max(0, total - completed - scheduled);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-text" dir="ltr">
        {t("patientDetail.overview.sessionsProgress", { completed, total })}
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-label={t("patientDetail.treatments.progressLabel")}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle"
      >
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
        <span>{t("patientDetail.treatments.completedCount", { count: completed })}</span>
        <span>{t("patientDetail.treatments.scheduledCount", { count: scheduled })}</span>
        <span>{t("patientDetail.treatments.remainingCount", { count: remaining })}</span>
      </div>
    </div>
  );
}
