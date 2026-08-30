import type { AppointmentSettingsFormValues, CabinetProfileFormValues, CabinetService } from "@/components/domain/settings/types";
import type { TeamRole } from "@/components/domain/team/types";
import { buildInitialWorkingHoursFormValues, type CabinetWorkingHoursFormValues } from "@/features/parametres/working-hours";

/**
 * Cabinet Onboarding wizard (UI-013X Gate 2). Composes EXISTING form-value
 * types from the already-shipped Paramètres module (task §14) — there is
 * no `OnboardingCabinet`/`OnboardingService`/`OnboardingWorkingHours` type
 * anywhere in this file or elsewhere; `CabinetProfileFormValues`,
 * `CabinetService`, `CabinetWorkingHoursFormValues` and
 * `AppointmentSettingsFormValues` are the exact same types Paramètres
 * itself edits.
 *
 * Step sequence (recorded decision, ADR-019): Cabinet -> Horaires ->
 * Services -> Équipe -> Préférences -> Récapitulatif -> Terminé. Spec #7
 * §28 / wireframe Screens 03-07 define a 5-screen sequence (Spécialité ->
 * Cabinet -> Horaires -> Services -> Complete) with no Équipe/Préférences
 * step; the task's own §15 instruction ("Follow exact specifications if
 * defined") is honored for the one fact both sources actually specify —
 * Horaires before Services — while Spécialité is folded into the Cabinet
 * step (matching this task's own explicit §17 field list) and Équipe/
 * Préférences/a rich Review step are kept per this task's own explicit
 * Gate 2 checklist, which the spec is simply silent on rather than
 * contradicting. See ADR-019 for the full reasoning.
 */
export type OnboardingStep = "cabinet" | "hours" | "services" | "team" | "preferences" | "review" | "complete";

/** Ordered wizard steps excluding the terminal `"complete"` state — used for progress-indicator math (task §16's "Étape X sur 6"). */
export const ONBOARDING_STEP_ORDER: Exclude<OnboardingStep, "complete">[] = [
  "cabinet",
  "hours",
  "services",
  "team",
  "preferences",
  "review",
];

/**
 * Lightweight draft team member (task §22's own bounded field list —
 * First name/Last name/Professional title/Role/Phone/Email only, never
 * `startDate`/`employeeNumber`/`status`, which don't matter for a
 * not-yet-created member). Deliberately NOT a `TeamMember`/
 * `TeamMemberFormValues` — task §23 explicitly forbids conflating a
 * Cabinet owner/TeamMember/UserAccount/Practitioner, and no `UserAccount`
 * or login credential is ever created from this draft (task §22: "Do NOT
 * create login credentials here").
 */
export interface OnboardingDraftTeamMember {
  id: string;
  firstName: string;
  lastName: string;
  professionalTitle: string;
  role: TeamRole;
  phone: string;
  email: string;
}

export function buildInitialOnboardingCabinetValues(): CabinetProfileFormValues {
  return { name: "", specialty: "general_medicine", address: "", city: "", phone: "", email: "", preferredLanguage: "fr" };
}

/** A brand-new cabinet has no prior schedule — every weekday starts closed (`buildInitialWorkingHoursFormValues([])`'s own behavior for an empty source array), never a silently invented default schedule. */
export function buildInitialOnboardingHoursValues(): CabinetWorkingHoursFormValues {
  return buildInitialWorkingHoursFormValues([]);
}

export function buildInitialOnboardingPreferencesValues(): AppointmentSettingsFormValues {
  return { defaultSchedulingMode: "exact", defaultDurationMinutes: "30" };
}

export const EMPTY_ONBOARDING_SERVICES: CabinetService[] = [];
export const EMPTY_ONBOARDING_TEAM: OnboardingDraftTeamMember[] = [];

/** Deterministic local id from an explicit sequence number — never `Math.random()` (mirrors UI-012ABCDE's own `buildBookingReference(sequence, ...)` pattern: the caller owns the counter, this stays a pure function). */
export function generateDraftTeamMemberId(sequence: number): string {
  return `draft-team-${sequence}`;
}
