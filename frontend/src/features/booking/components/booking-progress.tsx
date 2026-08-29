"use client";

import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";
import type { BookingStep } from "../booking-state";

const STEPS: { step: BookingStep; labelKey: string }[] = [
  { step: "service", labelKey: "booking.progress.service" },
  { step: "practitioner", labelKey: "booking.progress.practitioner" },
  { step: "date", labelKey: "booking.progress.date" },
  { step: "details", labelKey: "booking.progress.details" },
];

function activeIndexFor(step: BookingStep): number {
  if (step === "review") return 3;
  const index = STEPS.findIndex((entry) => entry.step === step);
  return index === -1 ? 0 : index;
}

/** Restrained progress indication (task §27: "Do not over-design") — never shown on the confirmation screen, which is its own clean full-screen state (Spec #9 Screen 52). */
export function BookingProgress({ step }: { step: BookingStep }) {
  const { t } = useLocale();
  const activeIndex = activeIndexFor(step);

  return (
    <ol className="flex items-center" aria-label={t("booking.hero.title")}>
      {STEPS.map((entry, index) => {
        const isActive = index === activeIndex;
        const isDone = index < activeIndex;

        return (
          <li key={entry.step} className="flex flex-1 items-center gap-2 last:flex-initial">
            <span
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                isDone && "border-primary bg-primary text-primary-foreground",
                isActive && "border-primary bg-primary-soft text-primary",
                !isDone && !isActive && "border-border bg-surface-subtle text-text-muted",
              )}
            >
              {index + 1}
            </span>
            <span className={cn("hidden text-xs font-medium sm:inline", isActive ? "text-text" : "text-text-muted")}>
              {t(entry.labelKey)}
            </span>
            {index < STEPS.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
