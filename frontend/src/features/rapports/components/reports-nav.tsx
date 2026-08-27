"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type ReportsSectionKey = "overview" | "activite" | "finance" | "equipe" | "stock";

/** Exact/path-aware matching (mirrors `StockNav`/`FinanceNav`): `/app/rapports` itself must only be active for the literal overview route. */
function resolveActiveSection(pathname: string): ReportsSectionKey {
  if (pathname.startsWith("/app/rapports/activite")) return "activite";
  if (pathname.startsWith("/app/rapports/finance")) return "finance";
  if (pathname.startsWith("/app/rapports/equipe")) return "equipe";
  if (pathname.startsWith("/app/rapports/stock")) return "stock";
  return "overview";
}

/**
 * Shared Reports workspace section navigation (UI-010ABC §10) — Vue
 * d'ensemble/Activité/Finance/Équipe/Stock. Mirrors `StockNav`/`FinanceNav`
 * exactly: real `<Link>`s via the existing `Tabs` primitive, `usePathname`
 * prefix matching, not a new sidebar entry — Reports stays one sidebar
 * module, this is its own internal section nav.
 */
export function ReportsNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "overview", label: t("rapports.nav.overview"), href: "/app/rapports" },
    { key: "activite", label: t("rapports.nav.activite"), href: "/app/rapports/activite" },
    { key: "finance", label: t("rapports.nav.finance"), href: "/app/rapports/finance" },
    { key: "equipe", label: t("rapports.nav.equipe"), href: "/app/rapports/equipe" },
    { key: "stock", label: t("rapports.nav.stock"), href: "/app/rapports/stock" },
  ];

  return <Tabs ariaLabel={t("rapports.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
