"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { MOBILE_NAV_ITEMS } from "@/lib/nav-config";
import { cn } from "@/lib/cn";

export interface MobileNavProps {
  onPlus: () => void;
}

/**
 * Mobile primary navigation (Spec #7 §39): Aujourd'hui, Agenda, Patients,
 * Plus. `Plus` still does not open the secondary-module sheet (no business
 * navigation behavior required for TASK-003) — it surfaces the same
 * established future-feature `Toast` notice every other deliberately-
 * deferred control in this app already uses (UI-FIX), rather than staying
 * silently inert.
 */
export function MobileNav({ onPlus }: MobileNavProps) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <nav
      aria-label={t("nav.plus")}
      className="grid shrink-0 grid-cols-4 border-t border-border bg-surface md:hidden"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium",
              isActive ? "text-primary" : "text-text-muted",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {t(item.translationKey)}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onPlus}
        className="flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium text-text-muted"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        {t("nav.plus")}
      </button>
    </nav>
  );
}
