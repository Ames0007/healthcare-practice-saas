/**
 * Public Booking & Effective Availability (UI-012ABCDE). This module's own
 * types only — every input (services, cabinet hours, calendar exceptions,
 * work intervals, leave requests, appointments) is read from the existing
 * sources already owned by Paramètres/Équipe/Agenda (task §5-6), never
 * duplicated here.
 */

/** A generic "HH:mm"–"HH:mm" span — deliberately its own minimal shape (not `CalendarExceptionInterval`/`WorkInterval`, which carry unrelated fields), mirroring those types' own "reuse validation, never merge the domain types" precedent. */
export interface Interval {
  startTime: string;
  endTime: string;
}

/**
 * Machine-readable, internal-only (task §22: "Do not expose internal
 * debugging strings directly" — the public UI maps every one of these to a
 * small, safe, translated label, never rendering the raw value). No
 * `outside_booking_horizon`/minimum-notice reason exists: neither concept
 * is implemented anywhere in `AppointmentSettings` nor defined by any
 * approved specification, so none is invented here (task §18/§19).
 */
export type UnavailableReason =
  | "past_date"
  | "cabinet_closed"
  | "holiday"
  | "practitioner_not_scheduled"
  | "practitioner_on_leave"
  | "fully_booked";

/** One offerable appointment start time for a specific service+practitioner+date — a projection, never persisted (task §21). */
export interface BookableSlot {
  startTime: string;
  endTime: string;
  practitionerId: string;
  serviceId: string;
}

/** One calendar day's resolved availability for a specific service+practitioner (task §21). */
export interface DayAvailability {
  date: string;
  isBookable: boolean;
  reason?: UnavailableReason;
  slots: BookableSlot[];
}

/**
 * The canonical schedulable-practitioner projection (task §30, CLAUDE.md's
 * own `TeamMember.practitionerId` doc comment). Carries both ids because
 * `WorkInterval`/`LeaveRequest` key on `TeamMember.id` while
 * `AgendaAppointment`/`BookableSlot` key on the lightweight
 * `AgendaPractitioner.id` — never conflated into one field.
 */
export interface SchedulablePractitioner {
  teamMemberId: string;
  practitionerId: string;
  /** Canonical display identity, verbatim from `AgendaPractitioner.name` (e.g. "Dr. Benali") — never re-derived from `firstName`/`lastName`. */
  name: string;
  professionalTitle?: string;
}
