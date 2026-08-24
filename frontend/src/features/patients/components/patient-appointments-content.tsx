"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonClassNames } from "@/components/ui/button";
import { AppointmentCard } from "@/components/domain/appointments/appointment-card";
import { AppointmentDrawer } from "@/features/agenda/components/appointment-drawer";
import { getAgendaMockAppointments } from "@/features/agenda/mock-data";
import type { AgendaAppointment } from "@/features/agenda/types";
import { PATIENTS_TODAY_DATE } from "@/features/patients/mock-data";
import { formatDayMonth } from "@/features/patients/format";
import {
  getPatientAppointments,
  groupAppointmentsByDate,
  matchesAppointmentFilter,
  splitUpcomingAndHistory,
  type AppointmentFilterGroup,
} from "@/features/patients/patient-appointments";
import { PatientAppointmentFilters } from "./patient-appointment-filters";

export type PatientAppointmentsState = "loading" | "loaded" | "error";

export interface PatientAppointmentsContentProps {
  patientId: string;
  /** Prototype seam for tests (UI-004B §9) — defaults to Agenda's own centralized mock appointments, filtered by `patientId`. */
  appointments?: AgendaAppointment[];
  state?: PatientAppointmentsState;
  onRetry?: () => void;
}

const AGENDA_HREF = "/app/agenda";

/**
 * Rendez-vous tab (UI-004B). Reuses Agenda's own centralized appointment
 * fixtures (UI-002) filtered by `patientId` rather than a second dataset
 * (§8). Agenda owns the one mutable appointment array; this tab only reads
 * the seed fixtures, so a mutation made in Agenda during this prototype
 * session is not reflected here and vice versa — real synchronization
 * arrives with the Laravel API (documented limitation, §9).
 */
export function PatientAppointmentsContent({
  patientId,
  appointments: providedAppointments,
  state = "loaded",
  onRetry,
}: PatientAppointmentsContentProps) {
  const { t, locale } = useLocale();
  const [filter, setFilter] = useState<AppointmentFilterGroup>("all");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  if (state === "loading") {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-6">
        <span className="sr-only">{t("common.loading")}</span>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <div className="flex justify-end">
            <Skeleton className="h-9 w-36" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Card>
            <Skeleton className="h-4 w-40" />
            <div className="mt-4 flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        title={t("patientDetail.appointments.errorTitle")}
        primaryAction={
          onRetry ? (
            <Button size="sm" onClick={onRetry}>
              {t("patientDetail.appointments.errorRetry")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const allAppointments = providedAppointments ?? getAgendaMockAppointments();
  const patientAppointments = getPatientAppointments(allAppointments, patientId);
  const selectedAppointment = patientAppointments.find((item) => item.id === selectedAppointmentId) ?? null;

  if (patientAppointments.length === 0) {
    return (
      <EmptyState
        title={t("patientDetail.appointments.emptyAllTitle")}
        description={t("patientDetail.appointments.emptyAllDescription")}
        primaryAction={
          <Link href={AGENDA_HREF} className={buttonClassNames("primary", "sm")}>
            {t("patientDetail.appointments.emptyAllAction")}
          </Link>
        }
      />
    );
  }

  const { upcoming, history } = splitUpcomingAndHistory(patientAppointments, PATIENTS_TODAY_DATE);

  const filteredSorted: AgendaAppointment[] =
    filter === "all"
      ? patientAppointments
      : filter === "upcoming"
        ? upcoming
        : history.filter((appointment) => matchesAppointmentFilter(appointment, filter, PATIENTS_TODAY_DATE));

  function renderUpcomingCard(appointment: AgendaAppointment) {
    return (
      <AppointmentCard
        key={appointment.id}
        variant="prominent"
        showPatientName={false}
        time={appointment.time}
        endTime={appointment.endTime}
        schedulingType={appointment.schedulingType}
        patientName={appointment.patientName}
        service={appointment.service}
        status={appointment.status}
        practitioner={appointment.practitionerName}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedAppointmentId(appointment.id)}>
              {t("patientDetail.appointments.viewAppointment")}
            </Button>
            <Link href={AGENDA_HREF} className={buttonClassNames("ghost", "sm")}>
              {t("patientDetail.appointments.openInAgenda")}
            </Link>
          </>
        }
      />
    );
  }

  function renderHistoryRow(appointment: AgendaAppointment) {
    return (
      <AppointmentCard
        key={appointment.id}
        variant="row"
        showPatientName={false}
        time={appointment.time}
        endTime={appointment.endTime}
        schedulingType={appointment.schedulingType}
        patientName={appointment.patientName}
        service={appointment.service}
        status={appointment.status}
        practitioner={appointment.practitionerName}
        onSelect={() => setSelectedAppointmentId(appointment.id)}
      />
    );
  }

  function renderDateGroups(items: AgendaAppointment[], renderCard: (appointment: AgendaAppointment) => ReactNode) {
    return groupAppointmentsByDate(items).map((group) => (
      <div key={group.date} className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted" dir="ltr">
          {formatDayMonth(group.date, locale)}
        </p>
        <div className="flex flex-col gap-2">{group.appointments.map(renderCard)}</div>
      </div>
    ));
  }

  function renderContent() {
    if (filter === "all") {
      return (
        <>
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t("patientDetail.appointments.upcomingTitle")}
            </h2>
            <div className="mt-4">
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-text-muted">{t("patientDetail.appointments.emptyUpcomingTitle")}</p>
                  <Link href={AGENDA_HREF} className={buttonClassNames("outline", "sm")}>
                    {t("patientDetail.appointments.emptyUpcomingAction")}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">{renderDateGroups(upcoming, renderUpcomingCard)}</div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {t("patientDetail.appointments.historyTitle")}
            </h2>
            <div className="mt-4">
              {history.length === 0 ? (
                <p className="text-sm text-text-muted">{t("patientDetail.appointments.emptyHistoryTitle")}</p>
              ) : (
                <div className="flex flex-col gap-4">{renderDateGroups(history, renderHistoryRow)}</div>
              )}
            </div>
          </Card>
        </>
      );
    }

    if (filteredSorted.length === 0) {
      return <p className="text-sm text-text-muted">{t("patientDetail.appointments.emptyFilteredTitle")}</p>;
    }

    const renderCard = filter === "upcoming" ? renderUpcomingCard : renderHistoryRow;
    return (
      <Card>
        <div className="flex flex-col gap-4">{renderDateGroups(filteredSorted, renderCard)}</div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Link href={AGENDA_HREF} className={buttonClassNames("primary", "sm")}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("patientDetail.appointments.newAppointment")}
        </Link>
      </div>

      <PatientAppointmentFilters active={filter} onChange={setFilter} resultCount={filteredSorted.length} />

      <div className="flex flex-col gap-6">{renderContent()}</div>

      <AppointmentDrawer
        appointment={selectedAppointment}
        open={selectedAppointmentId !== null}
        onClose={() => setSelectedAppointmentId(null)}
        patientLinkHref={AGENDA_HREF}
        patientLinkLabel={t("patientDetail.appointments.openInAgenda")}
      />
    </div>
  );
}
