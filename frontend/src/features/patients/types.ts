export interface PatientNextAppointment {
  date: string;
  time: string;
  /**
   * Display-only prototype field (UI-004A §25/§33) — Agenda's own mock
   * appointments are a separate, unlinked mock dataset (UI-002), so this
   * is not a real cross-module join. A real Patient 360° reads this from
   * the shared appointment record instead (CLAUDE.md §12).
   */
  service?: string;
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

  /** Optional administrative fields (UI-003B §10/§12) — still no clinical data. */
  birthDate?: string | null;
  email?: string | null;
  city?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
}

/** Create/edit form model (UI-003B §12) — deliberately not the full future database entity. */
export interface PatientFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  responsiblePractitionerId: string;
  birthDate: string;
  email: string;
  city: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface PatientDuplicateMatch {
  patient: Patient;
  reason: "phone" | "name";
}

export type NextAppointmentFilter = "all" | "today" | "upcoming" | "none";

export interface PatientListFilters {
  search: string;
  practitionerId: string;
  nextAppointment: NextAppointmentFilter;
}
