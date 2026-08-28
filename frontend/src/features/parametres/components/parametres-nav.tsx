"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type ParametresSectionKey = "cabinet" | "services" | "horaires" | "rendezVous" | "paiements" | "numerotation" | "documents";

/** Exact/path-aware matching (mirrors `StockNav`/`ReportsNav`): `/app/parametres` itself must only be active for the literal Cabinet route. */
function resolveActiveSection(pathname: string): ParametresSectionKey {
  if (pathname.startsWith("/app/parametres/services")) return "services";
  if (pathname.startsWith("/app/parametres/horaires")) return "horaires";
  if (pathname.startsWith("/app/parametres/rendez-vous")) return "rendezVous";
  if (pathname.startsWith("/app/parametres/paiements")) return "paiements";
  if (pathname.startsWith("/app/parametres/numerotation")) return "numerotation";
  if (pathname.startsWith("/app/parametres/documents")) return "documents";
  return "cabinet";
}

/**
 * Shared Paramètres workspace section navigation — started with just
 * "Cabinet" (UI-010ABC Gate 2's own root); "Services & tarifs", "Horaires"
 * and "Numérotation" were added by UI-010ABC Gate 3; "Rendez-vous",
 * "Paiements" and "Documents" were added by UI-010BC Gate 2 to complete the
 * full IA list (task §9) — mirrors `CommunicationNav`'s own documented
 * one-tab-per-gate growth (a nav never lists a tab whose route doesn't
 * exist yet).
 */
export function ParametresNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "cabinet", label: t("parametres.nav.cabinet"), href: "/app/parametres" },
    { key: "services", label: t("parametres.nav.services"), href: "/app/parametres/services" },
    { key: "horaires", label: t("parametres.nav.horaires"), href: "/app/parametres/horaires" },
    { key: "rendezVous", label: t("parametres.nav.rendezVous"), href: "/app/parametres/rendez-vous" },
    { key: "paiements", label: t("parametres.nav.paiements"), href: "/app/parametres/paiements" },
    { key: "numerotation", label: t("parametres.nav.numerotation"), href: "/app/parametres/numerotation" },
    { key: "documents", label: t("parametres.nav.documents"), href: "/app/parametres/documents" },
  ];

  return <Tabs ariaLabel={t("parametres.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
