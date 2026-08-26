"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs } from "@/components/ui/tabs";

type FinanceSectionKey = "overview" | "invoices" | "caisse" | "expenses";

/**
 * Exact/path-aware matching (UI-006X §9): `/app/finance` itself must only
 * be active for the literal overview route, never for every nested Finance
 * path (they all start with the same prefix) — `startsWith` alone would
 * keep "Vue d'ensemble" active everywhere.
 */
function resolveActiveSection(pathname: string): FinanceSectionKey {
  if (pathname.startsWith("/app/finance/invoices")) return "invoices";
  if (pathname.startsWith("/app/finance/caisse")) return "caisse";
  if (pathname.startsWith("/app/finance/expenses")) return "expenses";
  return "overview";
}

/**
 * Shared Finance workspace section navigation (UI-006X §8) — Vue
 * d'ensemble/Factures/Caisse/Décaissements, the four Finance screens that
 * actually exist today. Spec #9 Screen 24's own wireframe lists six
 * internal tabs (adding Échéances/Encaissements); those have no real
 * route yet, so including them here would link to nothing — deliberately
 * deferred until those screens exist (CLAUDE.md §1: this task's own
 * explicit four-item list takes priority over the wireframe). Reuses the
 * existing generic `Tabs` primitive (Spec #8 §48, already used by Patient
 * 360°) rather than a new nav component: real `<Link>`s, `aria-current`,
 * horizontally scrollable on mobile, logical-property spacing (RTL-safe)
 * — all already built in, not reimplemented here. Does not appear as a
 * new main-sidebar entry — Finance stays one sidebar module (§7); this is
 * the workspace's own internal section nav, one level below it.
 */
export function FinanceNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  return (
    <Tabs
      ariaLabel={t("finance.nav.navigationLabel")}
      activeKey={activeKey}
      items={[
        { key: "overview", label: t("finance.nav.overview"), href: "/app/finance" },
        { key: "invoices", label: t("finance.invoices.pageTitle"), href: "/app/finance/invoices" },
        { key: "caisse", label: t("finance.caisse.pageTitle"), href: "/app/finance/caisse" },
        { key: "expenses", label: t("finance.expenses.pageTitle"), href: "/app/finance/expenses" },
      ]}
    />
  );
}
