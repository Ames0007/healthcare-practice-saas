"use client";

import { Languages } from "lucide-react";
import { LOCALES, LOCALE_LABEL } from "@/i18n/config";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/cn";

/**
 * Working FR/AR switch (Spec #7 §25-26): updates visible translations, the
 * cookie-backed preference, and document lang/dir immediately.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("topbar.language")}
      className="inline-flex items-center gap-1 rounded-md border border-border p-1"
    >
      <Languages className="ms-1 h-4 w-4 text-text-muted" aria-hidden="true" />
      {LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          aria-pressed={locale === value}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors duration-150",
            locale === value
              ? "bg-primary text-primary-foreground"
              : "text-text-secondary hover:bg-surface-subtle",
          )}
        >
          {LOCALE_LABEL[value]}
        </button>
      ))}
    </div>
  );
}
