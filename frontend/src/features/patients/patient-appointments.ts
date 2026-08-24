import type { AppointmentStatus } from "@/components/domain/appointments/types";
import type { AgendaAppointment } from "@/features/agenda/types";

export function getPatientAppointments(appointments: AgendaAppointment[], patientId: string): AgendaAppointment[] {
  return appointments.filter((appointment) => appointment.patientId === patientId);
}

export type AppointmentFilterGroup = "all" | "upcoming" | "completed" | "cancelled" | "noShow";

const CANCELLED_STATUSES: ReadonlySet<AppointmentStatus> = new Set([
  "cancelled_by_patient",
  "cancelled_by_practice",
]);

/**
 * "Upcoming" is a status+date rule, not a date-only rule (UI-004B §16): a
 * terminal-outcome appointment (completed/cancelled/no-show/rescheduled) is
 * always history, even when its date is still in the future — a future
 * cancellation must not read as a normal upcoming visit. Anything else
 * counts as upcoming only from the fixed prototype business date onward;
 * an older non-terminal appointment (stale mock data) falls back to history.
 */
function isUpcoming(appointment: AgendaAppointment, todayIso: string): boolean {
  if (appointment.status === "completed" || appointment.status === "no_show" || appointment.status === "rescheduled") {
    return false;
  }
  if (CANCELLED_STATUSES.has(appointment.status)) {
    return false;
  }
  return appointment.date >= todayIso;
}

export function matchesAppointmentFilter(
  appointment: AgendaAppointment,
  group: AppointmentFilterGroup,
  todayIso: string,
): boolean {
  switch (group) {
    case "all":
      return true;
    case "upcoming":
      return isUpcoming(appointment, todayIso);
    case "completed":
      return appointment.status === "completed";
    case "cancelled":
      return CANCELLED_STATUSES.has(appointment.status);
    case "noShow":
      return appointment.status === "no_show";
  }
}

function compareByDateTimeAsc(a: AgendaAppointment, b: AgendaAppointment): number {
  return a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date);
}

export function sortAppointmentsAsc(appointments: AgendaAppointment[]): AgendaAppointment[] {
  return [...appointments].sort(compareByDateTimeAsc);
}

export function sortAppointmentsDesc(appointments: AgendaAppointment[]): AgendaAppointment[] {
  return sortAppointmentsAsc(appointments).reverse();
}

export function splitUpcomingAndHistory(
  appointments: AgendaAppointment[],
  todayIso: string,
): { upcoming: AgendaAppointment[]; history: AgendaAppointment[] } {
  const upcoming: AgendaAppointment[] = [];
  const history: AgendaAppointment[] = [];

  for (const appointment of appointments) {
    (isUpcoming(appointment, todayIso) ? upcoming : history).push(appointment);
  }

  return {
    upcoming: sortAppointmentsAsc(upcoming),
    history: sortAppointmentsDesc(history),
  };
}

export interface AppointmentDateGroup {
  date: string;
  appointments: AgendaAppointment[];
}

/** Groups already-sorted appointments into consecutive same-date clusters for the date subheadings (UI-004B §12/§14). */
export function groupAppointmentsByDate(appointments: AgendaAppointment[]): AppointmentDateGroup[] {
  const groups: AppointmentDateGroup[] = [];

  for (const appointment of appointments) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === appointment.date) {
      lastGroup.appointments.push(appointment);
    } else {
      groups.push({ date: appointment.date, appointments: [appointment] });
    }
  }

  return groups;
}
