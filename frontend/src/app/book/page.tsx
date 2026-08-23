"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FoundationBadge } from "@/components/app/foundation-badge";

/**
 * Public booking placeholder (Spec #7 §31, Spec #10 §34): more whitespace,
 * light background, narrow content, a teal primary action and a cabinet
 * identity area — distinct from the generic AreaPlaceholder used by
 * auth/onboarding/admin. The primary action stays disabled: this proves the
 * charter-approved visual treatment only, not real booking functionality.
 */
export default function BookPage() {
  const { t } = useLocale();

  return (
    <Card className="flex flex-col items-center gap-4 py-8 text-center">
      <FoundationBadge />

      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Building2 className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="text-sm font-medium text-text-muted">
        {t("areas.book.cabinetPlaceholder")}
      </span>

      <div>
        <h1 className="text-xl font-semibold text-text">{t("areas.book.title")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("areas.book.description")}</p>
      </div>

      <Button variant="primary" disabled className="w-full">
        {t("areas.book.primaryActionPlaceholder")}
      </Button>

      <Link href="/" className="text-sm font-medium text-primary hover:underline">
        /
      </Link>
    </Card>
  );
}
