import type { Locale } from "@/i18n/config";
import type { ClinicalCategory } from "@/components/domain/clinical/types";

/**
 * Bounded prototype clinical master-data catalog (UI-005A §12-14, Spec #2
 * §17.2's "search by keyword / select predefined / add custom" form
 * philosophy). Not a database-backed master-data management module — a
 * small synthetic FR/AR catalog demonstrating the architecture.
 */
export interface ClinicalMasterDataItem {
  id: string;
  category: ClinicalCategory;
  labelFr: string;
  labelAr: string;
  /** Extra search keywords (e.g. a common abbreviation) beyond the labels themselves. */
  searchTerms?: string[];
}

export function getClinicalMasterData(): ClinicalMasterDataItem[] {
  return [
    // Allergies
    { id: "mdi-allergy-penicilline", category: "allergy", labelFr: "Pénicilline", labelAr: "البنسلين" },
    { id: "mdi-allergy-amoxicilline", category: "allergy", labelFr: "Amoxicilline", labelAr: "أموكسيسيلين" },
    { id: "mdi-allergy-aspirine", category: "allergy", labelFr: "Aspirine", labelAr: "الأسبرين" },
    { id: "mdi-allergy-latex", category: "allergy", labelFr: "Latex", labelAr: "اللاتكس" },
    { id: "mdi-allergy-iode", category: "allergy", labelFr: "Iode", labelAr: "اليود" },
    { id: "mdi-allergy-arachides", category: "allergy", labelFr: "Arachides", labelAr: "الفول السوداني" },
    // Medical history / conditions
    {
      id: "mdi-history-hta",
      category: "history",
      labelFr: "Hypertension artérielle",
      labelAr: "ارتفاع ضغط الدم",
      searchTerms: ["HTA"],
    },
    { id: "mdi-history-diabete", category: "history", labelFr: "Diabète", labelAr: "السكري" },
    { id: "mdi-history-asthme", category: "history", labelFr: "Asthme", labelAr: "الربو" },
    { id: "mdi-history-cardiaque", category: "history", labelFr: "Maladie cardiaque", labelAr: "مرض القلب" },
    { id: "mdi-history-thyroide", category: "history", labelFr: "Trouble thyroïdien", labelAr: "اضطراب الغدة الدرقية" },
    { id: "mdi-history-chirurgie", category: "history", labelFr: "Chirurgie antérieure", labelAr: "جراحة سابقة" },
    // Current medications/treatments
    { id: "mdi-medication-metformine", category: "medication", labelFr: "Metformine", labelAr: "ميتفورمين" },
    { id: "mdi-medication-amlodipine", category: "medication", labelFr: "Amlodipine", labelAr: "أملوديبين" },
    { id: "mdi-medication-insuline", category: "medication", labelFr: "Insuline", labelAr: "الأنسولين" },
    {
      id: "mdi-medication-aspirine",
      category: "medication",
      labelFr: "Aspirine",
      labelAr: "الأسبرين",
      searchTerms: ["Acide acétylsalicylique"],
    },
    { id: "mdi-medication-levothyroxine", category: "medication", labelFr: "Levothyroxine", labelAr: "ليفوثيروكسين" },
  ];
}

export function getMasterDataLabel(item: ClinicalMasterDataItem, locale: Locale): string {
  return locale === "ar" ? item.labelAr : item.labelFr;
}

/** Case-insensitive and accent-insensitive (NFD-normalized) — no fuzzy/AI matching (§14). */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .trim();
}

export function searchClinicalMasterData(
  items: ClinicalMasterDataItem[],
  category: ClinicalCategory,
  query: string,
): ClinicalMasterDataItem[] {
  const normalizedQuery = normalizeSearchText(query);
  return items
    .filter((item) => item.category === category)
    .filter((item) => {
      if (!normalizedQuery) {
        return true;
      }
      const haystacks = [item.labelFr, item.labelAr, ...(item.searchTerms ?? [])];
      return haystacks.some((text) => normalizeSearchText(text).includes(normalizedQuery));
    });
}
