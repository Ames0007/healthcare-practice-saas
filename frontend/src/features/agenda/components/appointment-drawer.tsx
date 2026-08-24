"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Dialog } from "@/components/ui/dialog";
import { Button, buttonClassNames } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { APPOINTMENT_STATUS_MAP } from "@/components/domain/appointments/appointment-status";
import { APPOINTMENT_PRIMARY_ACTION, NO_SHOW_ELIGIBLE_STATUSES } from "@/features/agenda/status-actions";
import { formatBusinessDate } from "@/features/agenda/format";
import type { AgendaAppointment } from "@/features/agenda/types";
import type { AppointmentStatus } from "@/components/domain/appointments/types";

export interface AppointmentDrawerProps {
  appointment: AgendaAppointment | null;
  open: boolean;
  onClose: () => void;
  onPrimaryAction: (id: string, targetStatus: AppointmentStatus) => void;
  onEdit: (appointment: AgendaAppointment) => void;
  onReschedule: (appointment: AgendaAppointment) => void;
  onCancel: (appointment: AgendaAppointment) => void;
  onNoShow: (appointment: AgendaAppointment) => void;
}

/**
 * Appointment detail drawer (Spec #7 §7, Spec #9 Screen 11): patient,
 * phone, date/time, practitioner, status, a state-aware primary action,
 * and secondary/tertiary actions. All transitions are local prototype
 * state only (§15-16) — no persistence.
 */
export function AppointmentDrawer({
  appointment,
  open,
  onClose,
  onPrimaryAction,
  onEdit,
  onReschedule,
  onCancel,
  onNoShow,
}: AppointmentDrawerProps) {
  const { t, locale } = useLocale();

  if (!appointment) {
    return null;
  }

  const statusMeta = APPOINTMENT_STATUS_MAP[appointment.status];
  const primaryAction = APPOINTMENT_PRIMARY_ACTION[appointment.status];
  const canNoShow = NO_SHOW_ELIGIBLE_STATUSES.has(appointment.status);
  const isTerminal =
    appointment.status === "completed" ||
    appointment.status === "no_show" ||
    appointment.status === "cancelled_by_patient" ||
    appointment.status === "cancelled_by_practice";

  const timeLabel =
    appointment.schedulingType === "window" && appointment.endTime
      ? t("appointment.arrivalWindow", { start: appointment.time, end: appointment.endTime })
      : appointment.time;

  return (
    <Dialog open={open} onClose={onClose} variant="drawer" label={appointment.patientName} closeLabel={t("agenda.drawer.close")}>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-text">{appointment.patientName}</h2>
          {appointment.patientNumber && <p className="text-sm text-text-muted">{appointment.patientNumber}</p>}
          {appointment.patientPhone && <p className="text-sm text-text-muted" dir="ltr">{appointment.patientPhone}</p>}
        </div>

        <div className="flex flex-col gap-1 text-sm text-text">
          <p>{formatBusinessDate(appointment.date, locale)}</p>
          <p className="font-medium tabular-nums">{timeLabel}</p>
          <p>{appointment.service}</p>
          <p className="text-text-muted">{appointment.practitionerName}</p>
        </div>

        <StatusBadge tone={statusMeta.tone}>{t(statusMeta.translationKey)}</StatusBadge>

        {primaryAction && (
          <Button
            className="w-full"
            disabled={primaryAction.targetStatus === null}
            title={primaryAction.targetStatus === null ? t("agenda.drawer.futureFeature") : undefined}
            onClick={() =>
              primaryAction.targetStatus && onPrimaryAction(appointment.id, primaryAction.targetStatus)
            }
          >
            {t(primaryAction.translationKey)}
          </Button>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href="/app/patients" className={buttonClassNames("outline", "sm")}>
            {t("agenda.drawer.openPatient")}
          </Link>
          <Button variant="outline" size="sm" onClick={() => onEdit(appointment)} disabled={isTerminal}>
            {t("agenda.drawer.edit")}
          </Button>
        </div>

        {!isTerminal && (
          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <Button variant="ghost" size="sm" onClick={() => onReschedule(appointment)}>
              {t("agenda.drawer.reschedule")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onCancel(appointment)}>
              {t("agenda.drawer.cancel")}
            </Button>
            {canNoShow && (
              <Button variant="ghost" size="sm" className="text-danger hover:bg-danger-soft" onClick={() => onNoShow(appointment)}>
                {t("agenda.drawer.noShow")}
              </Button>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
