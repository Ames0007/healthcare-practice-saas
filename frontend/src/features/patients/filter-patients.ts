import type { NextAppointmentFilter, Patient } from "./types";
import { getPatientFullName } from "./format";

export interface PatientFilterState {
  search: string;
  practitionerId: string;
  nextAppointment: NextAppointmentFilter;
}

function matchesSearch(patient: Patient, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;

  const fullName = getPatientFullName(patient).toLowerCase();
  const normalizedPhone = patient.phone.replace(/\s+/g, "");
  const normalizedQueryDigits = normalizedQuery.replace(/\s+/g, "");

  return (
    fullName.includes(normalizedQuery) ||
    patient.firstName.toLowerCase().includes(normalizedQuery) ||
    patient.lastName.toLowerCase().includes(normalizedQuery) ||
    patient.patientNumber.toLowerCase().includes(normalizedQuery) ||
    normalizedPhone.includes(normalizedQueryDigits)
  );
}

function matchesNextAppointment(patient: Patient, filter: NextAppointmentFilter, todayIso: string): boolean {
  switch (filter) {
    case "all":
      return true;
    case "none":
      return patient.nextAppointment === null;
    case "today":
      return patient.nextAppointment !== null && patient.nextAppointment.date === todayIso;
    case "upcoming":
      return patient.nextAppointment !== null && patient.nextAppointment.date > todayIso;
  }
}

/** Local, in-memory filtering only (UI-003A §15/§46) — no backend query. */
export function filterPatients(patients: Patient[], filters: PatientFilterState, todayIso: string): Patient[] {
  const normalizedQuery = filters.search.trim().toLowerCase();

  return patients.filter(
    (patient) =>
      matchesSearch(patient, normalizedQuery) &&
      (filters.practitionerId === "all" || patient.responsiblePractitionerId === filters.practitionerId) &&
      matchesNextAppointment(patient, filters.nextAppointment, todayIso),
  );
}
