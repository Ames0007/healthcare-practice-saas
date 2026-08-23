"use client";

import { FlaskConical } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";

/**
 * Visible marker for TASK-003 placeholder/demo content (Spec 06 TASK-003
 * §23: "Clearly mark it as foundation/demo content."). Never used on real
 * product screens.
 */
export function FoundationBadge() {
  const { t } = useLocale();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-info-subtle px-2.5 py-1 text-xs font-medium text-info">
      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      {t("common.foundationBadge")}
    </span>
  );
}
