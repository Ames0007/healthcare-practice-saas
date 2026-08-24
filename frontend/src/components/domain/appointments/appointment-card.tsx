"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import { APPOINTMENT_STATUS_MAP } from "./appointment-status";
import type { AppointmentSchedulingType, AppointmentStatus } from "./types";

export interface AppointmentCardProps {
  time: string;
  endTime?: string;
  /**
   * CLAUDE.md §15 — exact vs arrival-window is a core distinction, never
   * just a dash-joined time range. Defaults to "window" when `endTime` is
   * present (UI-001 callers predate this prop).
   */
  schedulingType?: AppointmentSchedulingType;
  patientName: string;
  service?: string;
  status: AppointmentStatus;
  practitioner?: string;
  /** "row" (dense list), "prominent" (single highlighted card), "calendar" (compact grid cell). */
  variant?: "prominent" | "row" | "calendar";
  /** Caller-supplied action buttons — this component holds no business logic (Spec #8 §61). */
  actions?: ReactNode;
  /** When provided, the card becomes an interactive button (Agenda's click-to-open-drawer). */
  onSelect?: () => void;
  className?: string;
}

/**
 * Reusable appointment presentation (Spec #8 §61) — serves Aujourd'hui's
 * "Prochain rendez-vous" (prominent) and "Agenda du jour" (row), and
 * Agenda's day/week grid (calendar) and drawer trigger (UI-002).
 */
export function AppointmentCard({
  time,
  endTime,
  schedulingType,
  patientName,
  service,
  status,
  practitioner,
  variant = "row",
  actions,
  onSelect,
  className,
}: AppointmentCardProps) {
  const { t } = useLocale();
  const statusMeta = APPOINTMENT_STATUS_MAP[status];
  const isWindow = (schedulingType ?? (endTime ? "window" : "exact")) === "window";
  const timeLabel = endTime ? `${time}–${endTime}` : time;
  const windowCaption = isWindow && endTime ? t("appointment.arrivalWindow", { start: time, end: endTime }) : null;

  if (variant === "calendar") {
    const Wrapper = onSelect ? "button" : "div";
    return (
      <Wrapper
        type={onSelect ? "button" : undefined}
        onClick={onSelect}
        className={cn(
          "w-full rounded-md border border-border bg-surface px-3 py-2 text-start",
          onSelect && "transition-colors hover:border-primary-support hover:bg-primary-soft",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-text">
            {patientName}
            {service && <span className="text-text-muted"> · {service}</span>}
          </span>
          <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
        </div>
        {windowCaption && <p className="mt-0.5 text-xs text-text-muted">{windowCaption}</p>}
        {practitioner && <p className="mt-0.5 text-xs text-text-muted">{practitioner}</p>}
      </Wrapper>
    );
  }

  if (variant === "row") {
    const Wrapper = onSelect ? "button" : "div";
    return (
      <Wrapper
        type={onSelect ? "button" : undefined}
        onClick={onSelect}
        className={cn(
          "flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-b border-border py-3 text-start last:border-b-0",
          onSelect && "transition-colors hover:bg-surface-subtle",
          className,
        )}
      >
        <span className="flex w-16 shrink-0 flex-col tabular-nums text-text">
          <span className="text-sm font-medium">{timeLabel}</span>
          {isWindow && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
              {t("appointment.arrivalWindowShort")}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
          {patientName}
          {service && (
            <span className="ms-2 hidden font-normal text-text-muted sm:inline">{service}</span>
          )}
        </span>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
      </Wrapper>
    );
  }

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tabular-nums text-text">{timeLabel}</span>
          {windowCaption && <span className="text-xs font-medium text-text-muted">{windowCaption}</span>}
          <span className="text-base font-medium text-text">{patientName}</span>
          {service && <span className="text-sm text-text-muted">{service}</span>}
          {practitioner && <span className="text-xs text-text-muted">{practitioner}</span>}
        </div>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
      </div>
      {actions && <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div>}
    </Card>
  );
}
