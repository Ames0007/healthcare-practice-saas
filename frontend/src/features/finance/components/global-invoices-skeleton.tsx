"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched loading state (Spec #8 §57, UI-006B §34) — header, summary cards, search/filter controls, invoice rows. */
export function GlobalInvoicesSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} variant="metric">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>

        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-72" />

        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
