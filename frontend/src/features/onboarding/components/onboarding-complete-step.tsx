"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { buttonClassNames } from "@/components/ui/button";

/**
 * Completion (task §26, Spec #9 Screen 07). No tenant/database was
 * actually provisioned — there is no backend yet (task's own explicit
 * boundary) — so this screen never claims otherwise; `serverNotice` is
 * always shown, not a dismissible aside. The one action link is an
 * explicitly-labeled non-persistent preview transition to `/app` (task
 * §26's own conditional allowance) — never framed as "your cabinet is
 * live."
 */
export function OnboardingCompleteStep() {
  const { t } = useLocale();

  return (
    <Card className="flex flex-col items-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="text-xl font-semibold text-text">{t("onboarding.complete.heading")}</h1>
      <p className="text-sm text-text-secondary">{t("onboarding.complete.description")}</p>
      <p role="status" className="rounded-md border border-border bg-surface-subtle p-3 text-sm text-text-secondary">
        {t("onboarding.complete.serverNotice")}
      </p>
      <Link href="/app" className={buttonClassNames("primary", "md")}>
        {t("onboarding.complete.exploreAction")}
      </Link>
    </Card>
  );
}
