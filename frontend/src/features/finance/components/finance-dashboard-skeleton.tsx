"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched loading state (Spec #8 §57, UI-006A §44) — header, period controls, KPI row, receivables, activity. */
export function FinanceDashboardSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-8">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>

        <Skeleton className="h-10 w-64" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Card key={index} variant="metric">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Card>
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card>
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-32" />
          <Card>
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card>
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
