"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import { APPOINTMENT_STATUS_MAP } from "./appointment-status";
import type { AppointmentStatus } from "@/features/today/types";

export interface AppointmentCardProps {
  time: string;
  endTime?: string;
  patientName: string;
  service?: string;
  status: AppointmentStatus;
  practitioner?: string;
  /** "row" for dense list/calendar contexts, "prominent" for a single highlighted appointment. */
  variant?: "prominent" | "row";
  /** Caller-supplied action buttons — this component holds no business logic (Spec #8 §61). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Reusable appointment presentation (Spec #8 §61) — the same component
 * serves Aujourd'hui's "Prochain rendez-vous" (prominent) and "Agenda du
 * jour" (row), and is intended for Agenda (UI-002) as well.
 */
export function AppointmentCard({
  time,
  endTime,
  patientName,
  service,
  status,
  practitioner,
  variant = "row",
  actions,
  className,
}: AppointmentCardProps) {
  const { t } = useLocale();
  const statusMeta = APPOINTMENT_STATUS_MAP[status];
  const timeLabel = endTime ? `${time}–${endTime}` : time;

  if (variant === "row") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border py-3 last:border-b-0",
          className,
        )}
      >
        <span className="w-16 shrink-0 text-sm font-medium tabular-nums text-text">{timeLabel}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">
          {patientName}
          {service && (
            <span className="ms-2 hidden font-normal text-text-muted sm:inline">{service}</span>
          )}
        </span>
        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
      </div>
    );
  }

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-semibold tabular-nums text-text">{timeLabel}</span>
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
