"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched loading state (§44) — controls, calendar rows, no spinner. */
export function AgendaSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
        <Card>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
