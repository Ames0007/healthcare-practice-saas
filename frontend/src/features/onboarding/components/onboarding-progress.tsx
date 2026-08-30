"use client";

import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import { ONBOARDING_STEP_ORDER, type OnboardingStep } from "../onboarding-state";

const STEP_LABEL_KEYS: Record<Exclude<OnboardingStep, "complete">, string> = {
  cabinet: "onboarding.progress.cabinet",
  hours: "onboarding.progress.hours",
  services: "onboarding.progress.services",
  team: "onboarding.progress.team",
  preferences: "onboarding.progress.preferences",
  review: "onboarding.progress.review",
};

/** Restrained progress indicator (task §16, wireframe's own "Étape 1 sur 6" + [progress]) — never rendered on the terminal `"complete"` step (mirrors `BookingProgress`'s own precedent of hiding progress once the flow is actually finished). */
export function OnboardingProgress({ step }: { step: Exclude<OnboardingStep, "complete"> }) {
  const { t } = useLocale();
  const currentIndex = ONBOARDING_STEP_ORDER.indexOf(step);

  return (
    <div>
      <p className="text-sm font-medium text-text-muted">
        {t("onboarding.progress.stepLabel", { current: currentIndex + 1, total: ONBOARDING_STEP_ORDER.length })}
      </p>
      <ol className="mt-2 flex flex-wrap gap-2">
        {ONBOARDING_STEP_ORDER.map((s, index) => (
          <li
            key={s}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              index === currentIndex
                ? "bg-primary-soft text-primary"
                : index < currentIndex
                  ? "bg-success-soft text-success"
                  : "bg-surface-subtle text-text-muted",
            )}
          >
            {t(STEP_LABEL_KEYS[s])}
          </li>
        ))}
      </ol>
    </div>
  );
}
