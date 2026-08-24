import type { AppointmentSchedulingType, AppointmentStatus } from "@/components/domain/appointments/types";

export interface AgendaPractitioner {
  id: string;
  name: string;
}

export interface AgendaPatient {
  id: string;
  name: string;
  phone: string;
  patientNumber: string;
}

export interface AgendaAppointment {
  id: string;
  /** ISO date, e.g. "2026-08-24". */
  date: string;
  schedulingType: AppointmentSchedulingType;
  /** Start time (exact) or window start (window), "HH:mm". */
  time: string;
  /** Window end for "window"; exact appointments carry `durationMinutes` instead. */
  endTime?: string;
  durationMinutes?: number;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientNumber?: string;
  practitionerId: string;
  practitionerName: string;
  service: string;
  status: AppointmentStatus;
  note?: string;
  /** Prototype waiting-room reference (Spec §3 WF-12) — "HH:mm", set once status reaches "arrived". */
  arrivedAt?: string;
}

export interface AppointmentDraft {
  patientId: string | null;
  practitionerId: string;
  service: string;
  date: string;
  schedulingType: AppointmentSchedulingType;
  time: string;
  endTime: string;
  durationMinutes: number;
  initialStatus: Extract<AppointmentStatus, "to_confirm" | "confirmed">;
  note: string;
}
