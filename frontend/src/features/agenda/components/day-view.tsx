"use client";

import { Plus } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { AppointmentCard } from "@/components/domain/appointments/appointment-card";
import { generateTimeSlots, getContainingSlot } from "@/features/agenda/format";
import type { AgendaAppointment } from "@/features/agenda/types";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const SLOT_MINUTES = 30;

export interface DayViewProps {
  appointments: AgendaAppointment[];
  onSelectAppointment: (id: string) => void;
  onSelectSlot: (time: string) => void;
}

/**
 * Time-based daily schedule (§7-10). Each appointment renders at its
 * start-time row only (no proportional/height-based positioning) — a
 * deliberately simple layout matching Spec #9 Screen 09's schematic, not
 * a general calendar-library abstraction.
 */
export function DayView({ appointments, onSelectAppointment, onSelectSlot }: DayViewProps) {
  const { t } = useLocale();
  const slots = generateTimeSlots(DAY_START_HOUR, DAY_END_HOUR, SLOT_MINUTES);

  return (
    <div className="flex flex-col">
      {slots.map((slot) => {
        const slotAppointments = appointments.filter(
          (appointment) => getContainingSlot(appointment.time, SLOT_MINUTES) === slot,
        );

        return (
          <div key={slot} className="flex items-start gap-3 border-b border-border py-1.5 last:border-b-0">
            <span className="w-14 shrink-0 pt-1.5 text-xs font-medium tabular-nums text-text-muted">{slot}</span>
            <div className="min-w-0 flex-1 py-0.5">
              {slotAppointments.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {slotAppointments.map((appointment) => (
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
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  aria-label={t("agenda.addAtTime", { time: slot })}
                  className="flex h-8 w-full items-center gap-1.5 rounded-md px-1 text-xs text-text-muted hover:bg-surface-subtle"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
