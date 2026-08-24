export interface PatientNextAppointment {
  date: string;
  time: string;
}

/**
 * Administrative/operational fields only for the list (CLAUDE.md §13,
 * UI-003A §34) — no diagnosis, allergies, clinical notes or medical
 * history. Clinical data belongs to Dossier Santé (UI-004+ scope).
 */
export interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  responsiblePractitionerId: string;
  responsiblePractitionerName: string;
  /** ISO date of the last completed visit, or `null` if the patient never visited. */
  lastVisit: string | null;
  nextAppointment: PatientNextAppointment | null;
  /** MAD, fixed-precision mock amount. 0 means no outstanding balance. */
  outstandingBalance: number;
}

export type NextAppointmentFilter = "all" | "today" | "upcoming" | "none";

export interface PatientListFilters {
  search: string;
  practitionerId: string;
  nextAppointment: NextAppointmentFilter;
}
