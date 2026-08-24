"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched loading state (Spec #8 §57, UI-004A §40): header, tabs, overview cards, timeline — no spinner. */
export function PatientDetailSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <Skeleton className="h-9 w-64" />
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} variant="metric">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-6 w-32" />
            </Card>
          ))}
        </div>

        <Card>
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    </div>
  );
}
