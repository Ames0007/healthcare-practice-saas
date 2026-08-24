"use client";

import { Fragment } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { AppointmentCard } from "@/components/domain/appointments/appointment-card";
import { DayView } from "./day-view";
import {
  formatDayNumber,
  formatWeekdayShort,
  generateTimeSlots,
  getWeekDates,
  parseTimeToMinutes,
} from "@/features/agenda/format";
import type { AgendaAppointment } from "@/features/agenda/types";
import { cn } from "@/lib/cn";

const WEEK_START_HOUR = 8;
const WEEK_END_HOUR = 18;

export interface WeekViewProps {
  weekStartIso: string;
  /** All appointments across the week, already practitioner-filtered. */
  appointments: AgendaAppointment[];
  activeDayIso: string;
  onActiveDayChange: (iso: string) => void;
  onSelectAppointment: (id: string) => void;
  onSelectSlot: (dateIso: string, time: string) => void;
}

/**
 * Week grid on desktop; falls back to a horizontal day selector + the
 * same `DayView` chronological list on smaller screens (§34) — seven
 * cramped columns are not usable on mobile. Both are always rendered and
 * shown/hidden via CSS, matching AppShell/MobileNav's established pattern
 * rather than duplicating an appointment-list implementation.
 */
export function WeekView({
  weekStartIso,
  appointments,
  activeDayIso,
  onActiveDayChange,
  onSelectAppointment,
  onSelectSlot,
}: WeekViewProps) {
  const { t, locale } = useLocale();
  const days = getWeekDates(weekStartIso);
  const hours = generateTimeSlots(WEEK_START_HOUR, WEEK_END_HOUR, 60);

  return (
    <div>
      <div className="hidden overflow-x-auto lg:block">
        <div className="grid min-w-[720px] grid-cols-8 gap-px rounded-lg border border-border bg-border">
          <div className="bg-surface p-2" />
          {days.map((day) => (
            <div key={day} className="bg-surface p-2 text-center">
              <p className="text-xs font-medium uppercase text-text-muted">{formatWeekdayShort(day, locale)}</p>
              <p className="text-sm font-semibold text-text">{formatDayNumber(day, locale)}</p>
            </div>
          ))}

          {hours.map((hour) => (
            <Fragment key={hour}>
              <div className="bg-surface p-2 text-end text-xs font-medium tabular-nums text-text-muted">{hour}</div>
              {days.map((day) => {
                const hourAppointments = appointments.filter(
                  (appointment) =>
                    appointment.date === day &&
                    Math.floor(parseTimeToMinutes(appointment.time) / 60) === Math.floor(parseTimeToMinutes(hour) / 60),
                );

                return (
                  <div key={`${day}-${hour}`} className="min-h-12 bg-surface p-1">
                    <div className="flex flex-col gap-1">
                      {hourAppointments.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          variant="calendar"
                          time={appointment.time}
                          endTime={appointment.endTime}
                          schedulingType={appointment.schedulingType}
                          patientName={appointment.patientName}
                          service={appointment.service}
                          status={appointment.status}
                          practitioner={appointment.practitionerName}
                          onSelect={() => onSelectAppointment(appointment.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={t("agenda.week")}>
          {days.map((day) => (
            <button
              key={day}
              type="button"
              role="tab"
              aria-selected={day === activeDayIso}
              onClick={() => onActiveDayChange(day)}
              className={cn(
                "flex shrink-0 flex-col items-center rounded-md border px-3 py-2",
                day === activeDayIso ? "border-primary bg-primary-soft text-primary" : "border-border text-text-muted",
              )}
            >
              <span className="text-[10px] font-medium uppercase">{formatWeekdayShort(day, locale)}</span>
              <span className="text-sm font-semibold">{formatDayNumber(day, locale)}</span>
            </button>
          ))}
        </div>

        <DayView
          appointments={appointments.filter((appointment) => appointment.date === activeDayIso)}
          onSelectAppointment={onSelectAppointment}
          onSelectSlot={(time) => onSelectSlot(activeDayIso, time)}
        />
      </div>
    </div>
  );
}
