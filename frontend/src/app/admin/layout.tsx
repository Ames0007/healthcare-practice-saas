"use client";

import { useLocale } from "@/i18n/locale-provider";

/**
 * SaaS Super Admin shell (Spec #7 §32, Spec #9 §57): a separate product
 * surface from the tenant practice application — deliberately not reusing
 * AppShell/AppSidebar. Static placeholder navigation only; no SaaS admin
 * functionality is implemented in TASK-003.
 */
const ADMIN_NAV_KEYS = [
  "admin.nav.dashboard",
  "admin.nav.cabinets",
  "admin.nav.subscriptions",
  "admin.nav.plans",
  "admin.nav.masterData",
  "admin.nav.referrals",
  "admin.nav.operations",
  "admin.nav.audit",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-14 items-center border-b border-border-strong bg-text px-4">
        <span className="text-sm font-semibold text-text-inverse">{t("admin.brand")}</span>
      </header>

      <div className="flex flex-1">
        <nav className="hidden w-52 shrink-0 border-e border-border bg-surface p-3 sm:block">
          <ul className="flex flex-col gap-1">
            {ADMIN_NAV_KEYS.map((key) => (
              <li
                key={key}
                className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary"
              >
                {t(key)}
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
