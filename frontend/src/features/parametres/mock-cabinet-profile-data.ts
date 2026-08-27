import type { CabinetProfile } from "@/components/domain/settings/types";

/**
 * Single centralized synthetic cabinet profile (UI-010ABC Gate 2). `name`
 * deliberately matches `topbar.practiceName`'s own "Cabinet (exemple)"
 * value exactly — both represent the same example cabinet identity, so the
 * Settings page never contradicts what the sidebar/topbar already show for
 * an unedited prototype (task's own local-state-only rule means an edit
 * here does not propagate to the topbar — see `cabinet-settings-page.tsx`'s
 * header comment — but the *initial* value must still agree).
 */
export function getCabinetProfileMockData(): CabinetProfile {
  return {
    name: "Cabinet (exemple)",
    specialty: "general_medicine",
    address: "12 Rue des Orangers",
    city: "Casablanca",
    phone: "05 22 34 56 78",
    email: "contact@cabinet-exemple.test",
    preferredLanguage: "fr",
    currencyCode: "MAD",
    timezone: "Africa/Casablanca",
  };
}
