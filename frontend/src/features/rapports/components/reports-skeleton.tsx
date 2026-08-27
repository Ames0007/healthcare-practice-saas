"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface ReportsSkeletonProps {
  /** Number of KPI cards to shape-match (each report page has a different count). */
  metricCount?: number;
}

/** Shared shape-matched loading state (Spec #8 §57) for every Reports page — header, nav, period controls, KPI row. */
export function ReportsSkeleton({ metricCount = 3 }: ReportsSkeletonProps) {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-8">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>

        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-64" />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: metricCount }).map((_, index) => (
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
