"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { APPOINTMENT_STATUS_MAP } from "@/components/domain/appointments/appointment-status";
import { APPOINTMENT_PRIMARY_ACTION } from "@/features/agenda/status-actions";
import { computeWaitingMinutes } from "@/features/agenda/format";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { AppointmentStatus } from "@/components/domain/appointments/types";

const RELEVANT_STATUSES = new Set<AppointmentStatus>([
  "to_confirm",
  "confirmed",
  "arrived",
  "waiting",
  "in_consultation",
]);

export interface WaitingRoomProps {
  appointments: AgendaAppointment[];
  nowTime: string;
  onPrimaryAction: (id: string, targetStatus: AppointmentStatus) => void;
  onSelectAppointment: (id: string) => void;
}

/**
 * Operational patient-flow list (§37-40, Spec #7 §8): patient, appointment
 * time, arrival, waiting duration, status, direct per-row action. A plain
 * table/list — explicitly not Kanban complexity. Shares the same
 * centralized appointment state and lifecycle-action registry as the
 * Agenda drawer (§40), so a status change here is immediately visible
 * there too.
 */
export function WaitingRoom({ appointments, nowTime, onPrimaryAction, onSelectAppointment }: WaitingRoomProps) {
  const { t } = useLocale();
  const rows = appointments
    .filter((appointment) => RELEVANT_STATUSES.has(appointment.status))
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time));

  if (rows.length === 0) {
    return <EmptyState title={t("agenda.waitingRoomView.emptyTitle")} />;
  }

  return (
    <Card className="p-0">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase text-text-muted">
              <th className="px-4 py-3 text-start">{t("agenda.waitingRoomView.columns.patient")}</th>
              <th className="px-4 py-3 text-start">{t("agenda.waitingRoomView.columns.appointment")}</th>
              <th className="px-4 py-3 text-start">{t("agenda.waitingRoomView.columns.arrived")}</th>
              <th className="px-4 py-3 text-start">{t("agenda.waitingRoomView.columns.waiting")}</th>
              <th className="px-4 py-3 text-start">{t("agenda.waitingRoomView.columns.status")}</th>
              <th className="px-4 py-3 text-start">
                <span className="sr-only">{t("agenda.actions.title")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((appointment) => {
              const statusMeta = APPOINTMENT_STATUS_MAP[appointment.status];
              const primaryAction = APPOINTMENT_PRIMARY_ACTION[appointment.status];
              const waitingMinutes = appointment.arrivedAt ? computeWaitingMinutes(appointment.arrivedAt, nowTime) : null;

              return (
                <tr key={appointment.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectAppointment(appointment.id)}
                      className="font-medium text-text hover:underline"
                    >
                      {appointment.patientName}
                    </button>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-muted">{appointment.time}</td>
                  <td className="px-4 py-3 tabular-nums text-text-muted">
                    {appointment.arrivedAt ?? t("agenda.waitingRoomView.notArrived")}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-text-muted">
                    {waitingMinutes !== null
                      ? t("agenda.waitingRoomView.minutesShort", { count: waitingMinutes })
                      : t("agenda.waitingRoomView.notArrived")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-end">
                    {primaryAction?.targetStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPrimaryAction(appointment.id, primaryAction.targetStatus!)}
                      >
                        {t(primaryAction.translationKey)}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col divide-y divide-border md:hidden">
        {rows.map((appointment) => {
          const statusMeta = APPOINTMENT_STATUS_MAP[appointment.status];
          const primaryAction = APPOINTMENT_PRIMARY_ACTION[appointment.status];
          const waitingMinutes = appointment.arrivedAt ? computeWaitingMinutes(appointment.arrivedAt, nowTime) : null;

          return (
            <div key={appointment.id} className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectAppointment(appointment.id)}
                  className="font-medium text-text hover:underline"
                >
                  {appointment.patientName}
                </button>
                <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>
              </div>
              <p className="text-xs text-text-muted">
                {appointment.time}
                {waitingMinutes !== null && ` · ${t("agenda.waitingRoomView.minutesShort", { count: waitingMinutes })}`}
              </p>
              {primaryAction?.targetStatus && (
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => onPrimaryAction(appointment.id, primaryAction.targetStatus!)}
                >
                  {t(primaryAction.translationKey)}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
