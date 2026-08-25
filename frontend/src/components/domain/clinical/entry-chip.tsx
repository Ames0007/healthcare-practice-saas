"use client";

import { X } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";

export interface EntryChipProps {
  label: string;
  onRemove: () => void;
}

/**
 * A removable selected-entry chip inside the medical-profile edit drawer
 * (Spec #9 Screen 19/UI-005A §26/§28) — categorical values are an accepted
 * pill use case, not a general-purpose UI pattern (§28).
 */
export function EntryChip({ label, onRemove }: EntryChipProps) {
  const { t } = useLocale();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-subtle px-3 py-1 text-sm text-text">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={t("patientDetail.health.form.removeEntry", { label })}
        className="text-text-muted hover:text-danger"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </span>
  );
}
