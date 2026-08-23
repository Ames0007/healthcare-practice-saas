"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/locale-provider";
import { Card } from "@/components/ui/card";

const AREAS = [
  { href: "/auth", key: "areas.auth.title" },
  { href: "/onboarding", key: "areas.onboarding.title" },
  { href: "/app", key: "nav.aujourdhui" },
  { href: "/book", key: "areas.book.title" },
  { href: "/admin", key: "areas.admin.title" },
] as const;

/**
 * Root index — a minimal route-architecture index, not a marketing page.
 * Proves that all five top-level route areas (Spec #5 §5.2) resolve.
 */
export default function RootPage() {
  const { t } = useLocale();

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-text">{t("home.title")}</h1>
        <p className="mt-2 text-sm text-text-muted">{t("home.description")}</p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-text-secondary">
          {t("home.areasTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {AREAS.map((area) => (
            <Link key={area.href} href={area.href}>
              <Card className="transition-colors duration-150 hover:border-primary">
                <span className="text-sm font-medium text-text">{t(area.key)}</span>
                <span className="block text-xs text-text-muted">{area.href}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
