"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type HorairesSectionKey = "usual" | "exceptions";

/** Exact/path-aware matching (mirrors `AccessGovernanceNav`): `/app/parametres/horaires` itself must only be active for the literal Horaires habituelles route. */
function resolveActiveSection(pathname: string): HorairesSectionKey {
  if (pathname.startsWith("/app/parametres/horaires/exceptions")) return "exceptions";
  return "usual";
}

/**
 * Internal Horaires sub-navigation (UI-AGENDA-X, task §11) — nested one
 * level deeper than `ParametresNav` (which shows "Horaires" as its own
 * 3rd tab; both navs render together on every `/app/parametres/horaires*`
 * route, mirroring `AccessGovernanceNav`'s exact stacked-nav shape and
 * the UI-011X-FIX lesson: every Horaires page must render both
 * `ParametresNav` and `HorairesNav`, never one alone). "Horaires
 * habituelles" is the existing UI-010ABC weekly-schedule screen,
 * unchanged; "Calendrier & exceptions" is this task's own new screen.
 */
export function HorairesNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "usual", label: t("parametres.horaires.nav.usual"), href: "/app/parametres/horaires" },
    { key: "exceptions", label: t("parametres.horaires.nav.exceptions"), href: "/app/parametres/horaires/exceptions" },
  ];

  return <Tabs ariaLabel={t("parametres.horaires.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
