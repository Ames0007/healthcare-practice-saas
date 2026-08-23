"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { FoundationBadge } from "@/components/app/foundation-badge";

/**
 * Shared placeholder content for route areas that are architectural
 * boundaries only in TASK-003 (auth, onboarding, book). Proves the
 * route/layout exists without implementing the real screen.
 */
export function AreaPlaceholder({
  titleKey,
  descriptionKey,
}: {
  titleKey: string;
  descriptionKey: string;
}) {
  const { t } = useLocale();

  return (
    <Card className="flex flex-col items-start gap-3">
      <FoundationBadge />
      <h1 className="text-xl font-semibold text-text">{t(titleKey)}</h1>
      <p className="text-sm text-text-muted">{t(descriptionKey)}</p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        /
      </Link>
    </Card>
  );
}
