"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClassNames } from "@/components/ui/button";

/**
 * Catch-all for every real nav destination under /app that has no page
 * yet (Agenda, Patients, Finance, ...). TASK-003 proves navigation
 * architecture only — business screens are implemented by later tasks.
 */
export default function AppPlaceholderPage() {
  const { t } = useLocale();

  return (
    <EmptyState
      title={t("emptyState.notImplementedTitle")}
      description={t("emptyState.notImplementedDescription")}
      primaryAction={
        <Link href="/app" className={buttonClassNames("primary", "sm")}>
          {t("emptyState.backToHome")}
        </Link>
      }
    />
  );
}
