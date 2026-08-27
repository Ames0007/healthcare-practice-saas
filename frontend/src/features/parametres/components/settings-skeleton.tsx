"use client";

import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape-matched loading state (Spec #8 §57) for every Paramètres page — header, nav, one content card. */
export function SettingsSkeleton() {
  const { t } = useLocale();

  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">{t("common.loading")}</span>

      <div aria-hidden="true" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>

        <Skeleton className="h-10 w-48" />

        <Card>
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-4 w-32" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
