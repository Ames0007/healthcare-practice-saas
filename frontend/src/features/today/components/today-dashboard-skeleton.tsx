"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shape-matched loading state (Spec #8 §57, UI-001 §27) — mirrors the real
 * layout (header, KPI row, next appointment, agenda/to-do, finance)
 * instead of a generic centered spinner.
 */
export function TodayDashboardSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-8">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} variant="metric">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-7 w-12" />
            </Card>
          ))}
        </div>

        <Card>
          <Skeleton className="h-24 w-full" />
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <Skeleton className="h-48 w-full" />
          </Card>
          <Card>
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} variant="metric">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
