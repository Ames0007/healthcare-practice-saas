"use client";

import { useLocale } from "@/i18n/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";
import type { PatientTabKey } from "@/components/domain/patients/types";

/** Non-Aperçu tabs during UI-004A (§24) — the future task, when known, is cited explicitly (mirrors UI-002's "Ouvrir consultation" placeholder). */
const FUTURE_TASK_BY_TAB: Partial<Record<PatientTabKey, string>> = {};

export interface PatientTabPlaceholderProps {
  tab: Exclude<PatientTabKey, "overview">;
}

/** Keeps PatientHeader/tabs visible while the tab's real content is future scope — never the generic TASK-003 placeholder. */
export function PatientTabPlaceholder({ tab }: PatientTabPlaceholderProps) {
  const { t } = useLocale();
  const futureTask = FUTURE_TASK_BY_TAB[tab];

  return (
    <EmptyState
      title={t(`patientDetail.tabs.${tab}`)}
      description={
        futureTask
          ? t("patientDetail.tabs.placeholderWithTask", { task: futureTask })
          : t("patientDetail.tabs.placeholder")
      }
    />
  );
}
