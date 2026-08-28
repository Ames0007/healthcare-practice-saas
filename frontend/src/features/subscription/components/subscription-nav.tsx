"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/locale-provider";
import { Tabs, type TabItem } from "@/components/ui/tabs";

type SubscriptionSectionKey = "abonnement" | "plans" | "parrainage";

/** Exact/path-aware matching (mirrors `ParametresNav`/`StockNav`): `/app/abonnement` itself must only be active for the literal Abonnement route. */
function resolveActiveSection(pathname: string): SubscriptionSectionKey {
  if (pathname.startsWith("/app/abonnement/plans")) return "plans";
  if (pathname.startsWith("/app/abonnement/parrainage")) return "parrainage";
  return "abonnement";
}

/**
 * Internal Abonnement workspace navigation (UI-011ABC, task §45) —
 * Abonnement/Plans/Parrainage. Not added to the global sidebar: the
 * existing `NAV_ITEMS` entry for "abonnement" (`lib/nav-config.ts`) is the
 * only top-level sidebar link; Plans and Parrainage are reached from
 * inside the Abonnement module, mirroring `ParametresNav`'s own
 * one-main-sidebar-entry-many-internal-tabs shape.
 */
export function SubscriptionNav() {
  const pathname = usePathname();
  const { t } = useLocale();
  const activeKey = resolveActiveSection(pathname);

  const items: TabItem[] = [
    { key: "abonnement", label: t("abonnement.nav.abonnement"), href: "/app/abonnement" },
    { key: "plans", label: t("abonnement.nav.plans"), href: "/app/abonnement/plans" },
    { key: "parrainage", label: t("abonnement.nav.parrainage"), href: "/app/abonnement/parrainage" },
  ];

  return <Tabs ariaLabel={t("abonnement.nav.navigationLabel")} activeKey={activeKey} items={items} />;
}
