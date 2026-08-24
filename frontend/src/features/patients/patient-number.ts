import type { Patient } from "./types";

const PATIENT_NUMBER_PATTERN = /^PAT-(\d+)$/;

/**
 * Local prototype-only sequential reference (UI-003B §17) — production
 * numbering will be server-controlled/concurrency-safe (CLAUDE.md §21/§45),
 * this only has to look right in a single-user demo.
 */
export function generatePatientNumber(patients: Patient[]): string {
  const highest = patients.reduce((max, patient) => {
    const match = PATIENT_NUMBER_PATTERN.exec(patient.patientNumber);
    if (!match) return max;
    return Math.max(max, Number(match[1]));
  }, 0);

  return `PAT-${String(highest + 1).padStart(5, "0")}`;
}
