"use client";

import { useState } from "react";
import { useLocale } from "@/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import type { AppointmentSettingsFormValues, CabinetProfileFormValues, CabinetService } from "@/components/domain/settings/types";
import type { CabinetWorkingHoursFormValues } from "@/features/parametres/working-hours";
import {
  buildInitialOnboardingCabinetValues,
  buildInitialOnboardingHoursValues,
  buildInitialOnboardingPreferencesValues,
  EMPTY_ONBOARDING_SERVICES,
  EMPTY_ONBOARDING_TEAM,
  type OnboardingDraftTeamMember,
  type OnboardingStep,
} from "./onboarding-state";
import { OnboardingProgress } from "./components/onboarding-progress";
import { OnboardingCabinetStep } from "./components/onboarding-cabinet-step";
import { OnboardingHoursStep } from "./components/onboarding-hours-step";
import { OnboardingServicesStep } from "./components/onboarding-services-step";
import { OnboardingTeamStep } from "./components/onboarding-team-step";
import { OnboardingPreferencesStep } from "./components/onboarding-preferences-step";
import { OnboardingReviewStep } from "./components/onboarding-review-step";
import { OnboardingCompleteStep } from "./components/onboarding-complete-step";

const STEP_AFTER: Record<Exclude<OnboardingStep, "complete" | "review">, OnboardingStep> = {
  cabinet: "hours",
  hours: "services",
  services: "team",
  team: "preferences",
  preferences: "review",
};

const STEP_BEFORE: Record<Exclude<OnboardingStep, "complete" | "cabinet">, OnboardingStep> = {
  hours: "cabinet",
  services: "hours",
  team: "services",
  preferences: "team",
  review: "preferences",
};

/**
 * Cabinet Onboarding wizard (UI-013X Gate 2 §12). Each step manages its
 * own local form state (mirroring `CabinetSettingsPage`/`WorkingHoursPage`/
 * `ServicesPage`'s own established validate-on-submit pattern) and only
 * reports upward via `onChange`/`onContinue` — this component just holds
 * the accumulated draft plus which step is active (task §27: back
 * navigation never loses in-memory state, since nothing unmounts the
 * wizard itself, only swaps which step renders). No `localStorage`, no
 * API calls (task's own explicit boundary) — a refresh resets the whole
 * draft, which is expected and undocumented nowhere as a defect.
 */
export function OnboardingWizard() {
  const { t } = useLocale();
  const [step, setStep] = useState<OnboardingStep>("cabinet");
  const [cabinet, setCabinet] = useState<CabinetProfileFormValues>(buildInitialOnboardingCabinetValues);
  const [hours, setHours] = useState<CabinetWorkingHoursFormValues>(buildInitialOnboardingHoursValues);
  const [services, setServices] = useState<CabinetService[]>(EMPTY_ONBOARDING_SERVICES);
  const [team, setTeam] = useState<OnboardingDraftTeamMember[]>(EMPTY_ONBOARDING_TEAM);
  const [preferences, setPreferences] = useState<AppointmentSettingsFormValues>(buildInitialOnboardingPreferencesValues);

  function goToStep(target: OnboardingStep) {
    setStep(target);
  }

  function continueFrom(current: Exclude<OnboardingStep, "complete" | "review">) {
    setStep(STEP_AFTER[current]);
  }

  function backFrom(current: Exclude<OnboardingStep, "complete" | "cabinet">) {
    setStep(STEP_BEFORE[current]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-text-muted">{t("home.title")}</span>
        <LanguageSwitcher />
      </div>

      {step !== "complete" && <OnboardingProgress step={step} />}

      {step === "cabinet" && (
        <OnboardingCabinetStep values={cabinet} onChange={setCabinet} onContinue={() => continueFrom("cabinet")} />
      )}

      {step === "hours" && (
        <OnboardingHoursStep values={hours} onChange={setHours} onContinue={() => continueFrom("hours")} onBack={() => backFrom("hours")} />
      )}

      {step === "services" && (
        <OnboardingServicesStep
          services={services}
          onChange={setServices}
          onContinue={() => continueFrom("services")}
          onBack={() => backFrom("services")}
        />
      )}

      {step === "team" && (
        <OnboardingTeamStep members={team} onChange={setTeam} onContinue={() => continueFrom("team")} onBack={() => backFrom("team")} />
      )}

      {step === "preferences" && (
        <OnboardingPreferencesStep
          values={preferences}
          onChange={setPreferences}
          onContinue={() => continueFrom("preferences")}
          onBack={() => backFrom("preferences")}
        />
      )}

      {step === "review" && (
        <OnboardingReviewStep
          cabinet={cabinet}
          hours={hours}
          services={services}
          team={team}
          preferences={preferences}
          onEditStep={goToStep}
          onFinish={() => setStep("complete")}
        />
      )}

      {step === "complete" && <OnboardingCompleteStep />}
    </div>
  );
}
