"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched loading state (Spec #8 §57, task §32) — no spinner. */
export function LeaveCalendarSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Card className="p-0">
          <div className="flex flex-col gap-4 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
