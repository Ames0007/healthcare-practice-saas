import type { DocumentSettings } from "@/components/domain/settings/types";
import { getCabinetProfileMockData } from "./mock-cabinet-profile-data";
import { buildDefaultDocumentFooter } from "./document-settings";

/**
 * Centralized synthetic Documents settings (UI-010BC Gate 2). `footerText`/
 * `documentLanguage` derive from the same Cabinet profile fixture Cabinet
 * Settings itself reads (`getCabinetProfileMockData`), never an
 * independently invented example — proven live in
 * `cross-configuration-integrity.test.ts`.
 */
export function getDocumentSettingsMockData(): DocumentSettings {
  const profile = getCabinetProfileMockData();
  return {
    footerText: buildDefaultDocumentFooter(profile),
    documentLanguage: profile.preferredLanguage,
  };
}
