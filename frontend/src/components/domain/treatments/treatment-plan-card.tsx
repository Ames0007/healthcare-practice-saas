"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import { SessionProgress } from "./session-progress";
import { TREATMENT_STATUS_MAP } from "./treatment-status";
import type { TreatmentPlanStatus } from "./types";

export interface TreatmentPlanCardNextSession {
  label: string;
}

export interface TreatmentPlanCardProps {
  /** "active" (rich card with progress/actions) or "completed" (dense clickable row, mirrors AppointmentCard's row variant). */
  variant?: "active" | "completed";
  title: string;
  status: TreatmentPlanStatus;
  practitionerName: string;
  startDateLabel: string;
  completedDateLabel?: string;
  completedSessions: number;
  scheduledSessions: number;
  totalSessions: number;
  nextSession?: TreatmentPlanCardNextSession | null;
  /** Caller-supplied action buttons — this component holds no business logic (Spec #8 §61, same convention as AppointmentCard). */
  actions?: ReactNode;
  /** Completed variant only — makes the whole row clickable, like AppointmentCard's history rows. */
  onSelect?: () => void;
  className?: string;
}

/** Reusable treatment-plan presentation (Spec #8 §97, UI-004C §14) — takes only pre-resolved display strings/typed data, no mock-data coupling. */
export function TreatmentPlanCard({
  variant = "active",
  title,
  status,
  practitionerName,
  startDateLabel,
  completedDateLabel,
  completedSessions,
  scheduledSessions,
  totalSessions,
  nextSession,
  actions,
  onSelect,
  className,
}: TreatmentPlanCardProps) {
  const { t } = useLocale();
  const statusMeta = TREATMENT_STATUS_MAP[status];

  if (variant === "completed") {
    const Wrapper = onSelect ? "button" : "div";
    return (
      <Wrapper
        type={onSelect ? "button" : undefined}
        onClick={onSelect}
        className={cn(
          "flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border py-3 text-start last:border-b-0",
          onSelect && "transition-colors hover:bg-surface-subtle",
          className,
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{title}</p>
          <p className="text-xs text-text-muted">
            {t("patientDetail.overview.sessionsProgress", { completed: completedSessions, total: totalSessions })}
            {completedDateLabel && (
              <span>
                {" "}
                · {t("patientDetail.treatments.completedOn", { date: completedDateLabel })}
              </span>
            )}
          </p>
        </div>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
      </Wrapper>
    );
  }

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text">{title}</h3>
            <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
          </div>
          <p className="mt-1 text-sm text-text-muted">{practitionerName}</p>
          <p className="text-sm text-text-muted">
            {t("patientDetail.treatments.startDateInline", { date: startDateLabel })}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <SessionProgress completed={completedSessions} scheduled={scheduledSessions} total={totalSessions} />
      </div>

      {nextSession && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("patientDetail.treatments.nextSessionLabel")}
          </p>
          <p className="text-sm text-text" dir="ltr">
            {nextSession.label}
          </p>
        </div>
      )}

      {actions && <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div>}
    </Card>
  );
}
