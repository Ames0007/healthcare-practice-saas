"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useLocale } from "@/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/app/language-switcher";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav-config";
import { cn } from "@/lib/cn";

/**
 * SaaS Platform Admin shell (UI-013ABCDE Gate 1 §07/§08/§09, Spec #7 §32,
 * Spec #10 §32). A separate product surface from `/app` (task §5: "Do not
 * reuse AppSidebar for Admin merely because it already exists") — this
 * component shares the same design-system tokens (Spec #10 §32: "Use the
 * same visual system... Do not create a dark developer/admin theme") but
 * never imports `AppShell`/`AppSidebar`. `ShieldAlert` + the always-visible
 * "Administration SaaS" brand label make the context unmistakable (task
 * §8: never confusable with "Cabinet (exemple)").
 *
 * Frontend Admin UI ≠ Platform authorization (task §6): this shell renders
 * directly for prototype QA, with no login/session gate — a future task
 * must protect every `/admin/*` route server-side; nothing here should be
 * read as implying that protection already exists.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-text">{t("admin.brand")}</span>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="flex flex-1">
        <nav aria-label={t("admin.nav.ariaLabel")} className="hidden w-52 shrink-0 border-e border-border bg-surface p-3 sm:block">
          <ul className="flex flex-col gap-1">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                      isActive ? "bg-primary-soft text-primary" : "text-text-secondary hover:bg-surface-subtle hover:text-text",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t(item.translationKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
