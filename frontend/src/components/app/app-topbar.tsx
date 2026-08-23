"use client";

import { Bell, Plus, Search, UserRound } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { Button } from "@/components/ui/button";

export function AppTopbar() {
  const { t } = useLocale();

  return (
    <header className="flex h-(--ds-topbar-height) shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <div className="relative flex-1 max-w-md">
        <Search
          className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={t("topbar.searchPlaceholder")}
          aria-label={t("topbar.searchPlaceholder")}
          className="h-9 w-full rounded-md border border-border-strong bg-background ps-9 pe-3 text-sm text-text placeholder:text-text-muted"
        />
      </div>

      <Button variant="primary" size="sm" className="hidden sm:inline-flex">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("topbar.quickCreate")}
      </Button>

      <button
        type="button"
        aria-label={t("topbar.notifications")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-subtle"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
      </button>

      <LanguageSwitcher />

      <button
        type="button"
        aria-label={t("topbar.user")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-text-secondary hover:bg-border/60"
      >
        <UserRound className="h-5 w-5" aria-hidden="true" />
      </button>
    </header>
  );
}
