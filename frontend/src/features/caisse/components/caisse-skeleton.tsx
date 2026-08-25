"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched loading state (Spec #8 §57, UI-006C §45) — header/status, cash summary, movement list. */
export function CaisseSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} variant="metric">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>

        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
