import type { CabinetSpecialty } from "./types";

interface CabinetSpecialtyMeta {
  translationKey: string;
}

/**
 * Central specialty → label registry, mirroring `<enum>.ts`'s established
 * map pattern (e.g. `expense-category.ts`). The 7 values are CLAUDE.md's
 * own "Primary initial specialties" list verbatim — not invented, and
 * deliberately not a full searchable master-data catalog (CLAUDE.md §14's
 * SEARCH→SELECT→CUSTOMIZE workflow is out of bounded scope for a single
 * cabinet-level "primary specialty" field).
 */
export const CABINET_SPECIALTY_MAP: Record<CabinetSpecialty, CabinetSpecialtyMeta> = {
  general_medicine: { translationKey: "parametres.cabinet.specialty.generalMedicine" },
  dentistry: { translationKey: "parametres.cabinet.specialty.dentistry" },
  physiotherapy: { translationKey: "parametres.cabinet.specialty.physiotherapy" },
  psychology: { translationKey: "parametres.cabinet.specialty.psychology" },
  nutrition: { translationKey: "parametres.cabinet.specialty.nutrition" },
  dermatology: { translationKey: "parametres.cabinet.specialty.dermatology" },
  multi_practitioner: { translationKey: "parametres.cabinet.specialty.multiPractitioner" },
};

export const CABINET_SPECIALTY_ORDER: CabinetSpecialty[] = [
  "general_medicine",
  "dentistry",
  "physiotherapy",
  "psychology",
  "nutrition",
  "dermatology",
  "multi_practitioner",
];
