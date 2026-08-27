"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type ParametresSectionKey = "cabinet" | "services" | "horaires" | "numerotation";

/** Exact/path-aware matching (mirrors `StockNav`/`ReportsNav`): `/app/parametres` itself must only be active for the literal Cabinet route. */
function resolveActiveSection(pathname: string): ParametresSectionKey {
  if (pathname.startsWith("/app/parametres/services")) return "services";
  if (pathname.startsWith("/app/parametres/horaires")) return "horaires";
  if (pathname.startsWith("/app/parametres/numerotation")) return "numerotation";
  return "cabinet";
}

/**
 * Shared Paramètres workspace section navigation (UI-010ABC Gate 2/3) —
 * started with just "Cabinet" (Gate 2's own root); "Services & tarifs",
 * "Horaires" and "Numérotation" were added by Gate 3 — mirrors
 * `CommunicationNav`'s own documented one-tab-per-gate growth (a nav never
 * lists a tab whose route doesn't exist yet).
 */
export function ParametresNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "cabinet", label: t("parametres.nav.cabinet"), href: "/app/parametres" },
    { key: "services", label: t("parametres.nav.services"), href: "/app/parametres/services" },
    { key: "horaires", label: t("parametres.nav.horaires"), href: "/app/parametres/horaires" },
    { key: "numerotation", label: t("parametres.nav.numerotation"), href: "/app/parametres/numerotation" },
  ];

  return <Tabs ariaLabel={t("parametres.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
