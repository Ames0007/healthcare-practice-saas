import type { ClinicalEncounter, ClinicalEncounterType } from "@/components/domain/clinical/types";

export function getEncountersForPatient(encounters: ClinicalEncounter[], patientId: string): ClinicalEncounter[] {
  return encounters.filter((encounter) => encounter.patientId === patientId);
}

function compareByDateTimeDesc(a: ClinicalEncounter, b: ClinicalEncounter): number {
  if (a.date !== b.date) {
    return b.date.localeCompare(a.date);
  }
  return (b.time ?? "").localeCompare(a.time ?? "");
}

/** Newest first (§13) — explicit derivation, never relies on fixture insertion order. */
export function sortEncountersDesc(encounters: ClinicalEncounter[]): ClinicalEncounter[] {
  return [...encounters].sort(compareByDateTimeDesc);
}

export type ClinicalHistoryFilterGroup = "all" | "consultations" | "sessions";

const FILTER_TYPE: Record<Exclude<ClinicalHistoryFilterGroup, "all">, ClinicalEncounterType> = {
  consultations: "consultation",
  sessions: "session",
};

/** Only the lightweight All/Consultations/Sessions filter — no practitioner/date-range/diagnosis filtering (§17). */
export function matchesClinicalHistoryFilter(encounter: ClinicalEncounter, group: ClinicalHistoryFilterGroup): boolean {
  if (group === "all") {
    return true;
  }
  return encounter.encounterType === FILTER_TYPE[group];
}

export interface ClinicalEncounterDateGroup {
  date: string;
  encounters: ClinicalEncounter[];
}

/** Groups already-sorted encounters into consecutive same-date clusters (mirrors `groupAppointmentsByDate`, UI-004B §12/14). */
export function groupEncountersByDate(encounters: ClinicalEncounter[]): ClinicalEncounterDateGroup[] {
  const groups: ClinicalEncounterDateGroup[] = [];

  for (const encounter of encounters) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === encounter.date) {
      lastGroup.encounters.push(encounter);
    } else {
      groups.push({ date: encounter.date, encounters: [encounter] });
    }
  }

  return groups;
}
