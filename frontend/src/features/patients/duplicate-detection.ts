import { normalizeName, normalizePhoneDigits } from "./normalize";
import type { Patient, PatientDuplicateMatch } from "./types";

export interface DuplicateCandidate {
  firstName: string;
  lastName: string;
  phone: string;
}

/**
 * Local, prototype-only probable-duplicate check (UI-003B §18, Spec #4 §8):
 * same normalized phone, or same normalized first+last name. Never merges
 * or blocks creation — callers decide what to do with the matches
 * (CLAUDE.md §12: "Do not auto-merge."). `excludePatientId` lets Edit check
 * against every *other* patient (§28/§29).
 */
export function findDuplicatePatients(
  patients: Patient[],
  candidate: DuplicateCandidate,
  excludePatientId?: string,
): PatientDuplicateMatch[] {
  const candidatePhone = normalizePhoneDigits(candidate.phone);
  const candidateFirst = normalizeName(candidate.firstName);
  const candidateLast = normalizeName(candidate.lastName);

  const matches: PatientDuplicateMatch[] = [];

  for (const patient of patients) {
    if (patient.id === excludePatientId) continue;

    if (candidatePhone && normalizePhoneDigits(patient.phone) === candidatePhone) {
      matches.push({ patient, reason: "phone" });
      continue;
    }

    if (
      normalizeName(patient.firstName) === candidateFirst &&
      normalizeName(patient.lastName) === candidateLast &&
      candidateFirst !== "" &&
      candidateLast !== ""
    ) {
      matches.push({ patient, reason: "name" });
    }
  }

  return matches;
}
